import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  resolvePagination,
  toPaginated,
} from '@common/pagination/paginate.util';
import type { IPaginated } from '@common/pagination/paginated.type';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { ListCustomersQueryDto } from '@/modules/customers/dto/list-customers-query.dto';
import {
  CustomersRepository,
  type CustomerRosterRow,
  type SalesRollup,
  type SalesRollupMaps,
} from '@/modules/customers/customers.repository';
import type {
  CustomerProfileDetail,
  CustomerSummary,
} from '@/modules/customers/types';

@Injectable()
export class CustomersService {
  constructor(private readonly repo: CustomersRepository) {}

  async list(
    dto: ListCustomersQueryDto,
    actor: AuthUser,
  ): Promise<IPaginated<CustomerSummary>> {
    const branchId = this.resolveBranchScope(actor, dto.branchId);
    const { page, limit, skip } = resolvePagination({
      page: dto.page,
      limit: dto.limit,
    });

    const { rows, total } = await this.repo.listRoster({
      branchId,
      search: dto.search,
      type: dto.type ?? 'all',
      status: dto.status,
      segment: dto.segment,
      tag: dto.tag,
      sort: dto.sort ?? 'name',
      limit,
      skip,
    });

    // Enrich only the page's identities with their sales rollups.
    const rollups = await this.repo.salesRollups({
      userIds: rows.flatMap((r) => r.userIds),
      loyaltyIds: rows.flatMap((r) => r.loyaltyIds),
      creditIds: rows.flatMap((r) => r.creditIds),
    });

    const items = rows.map((row) => this.toSummary(row, rollups));
    return toPaginated(items, total, page, limit);
  }

  /** The composed 360 profile for one stitched customer. */
  async getProfile(
    key: string,
    actor: AuthUser,
  ): Promise<CustomerProfileDetail> {
    const branchId = this.resolveBranchScope(actor, undefined);
    const identity = await this.repo.findIdentityByKey(key, branchId);
    if (!identity) {
      throw new NotFoundException('Customer not found');
    }
    const ids = {
      userIds: identity.userIds,
      loyaltyIds: identity.loyaltyIds,
      creditIds: identity.creditIds,
    };

    const [rollups, creditAccounts, recentSales, recentOrders] =
      await Promise.all([
        this.repo.salesRollups(ids),
        this.repo.creditAccounts(ids.creditIds),
        this.repo.recentSales(ids, 8),
        this.repo.recentOrders(ids.userIds, 8),
      ]);

    const { ordersCount, lifetimeSpend, lastSeenAt } = this.aggregateRollups(
      ids,
      rollups,
    );

    return {
      customerKey: identity.customerKey,
      displayName: identity.displayName,
      phone: identity.phone,
      email: identity.email,
      types: identity.types,
      homeBranchId: identity.homeBranchId,
      homeBranchName: identity.homeBranchName,
      status: identity.status === 'blocked' ? 'blocked' : 'active',
      tags: identity.tags,
      notes: identity.notes,
      segment: identity.segment,
      kpis: {
        loyaltyPoints: identity.loyaltyPoints,
        creditBalance: identity.creditBalance,
        ordersCount,
        lifetimeSpend,
        avgOrderValue:
          ordersCount > 0
            ? Math.round((lifetimeSpend / ordersCount) * 100) / 100
            : 0,
        lastSeenAt,
      },
      creditAccounts,
      recentSales,
      recentOrders,
      ids,
    };
  }

  private toSummary(
    row: CustomerRosterRow,
    rollups: SalesRollupMaps,
  ): CustomerSummary {
    const { ordersCount, lifetimeSpend, lastSeenAt } = this.aggregateRollups(
      {
        userIds: row.userIds,
        loyaltyIds: row.loyaltyIds,
        creditIds: row.creditIds,
      },
      rollups,
    );

    return {
      customerKey: row.customerKey,
      displayName: row.displayName,
      phone: row.phone,
      email: row.email,
      types: row.types,
      homeBranchId: row.homeBranchId,
      homeBranchName: row.homeBranchName,
      loyaltyPoints: row.loyaltyPoints,
      creditBalance: row.creditBalance,
      ordersCount,
      lifetimeSpend,
      lastSeenAt,
      tags: row.tags,
      status: row.status === 'blocked' ? 'blocked' : 'active',
    };
  }

  // Sum a customer's sales rollups across all its underlying identity ids.
  private aggregateRollups(
    ids: { userIds: string[]; loyaltyIds: string[]; creditIds: string[] },
    rollups: SalesRollupMaps,
  ): { ordersCount: number; lifetimeSpend: number; lastSeenAt: string | null } {
    let ordersCount = 0;
    let lifetimeSpend = 0;
    let lastSeenAt: string | null = null;
    const absorb = (map: Map<string, SalesRollup>, list: string[]): void => {
      for (const id of list) {
        const r = map.get(id);
        if (!r) continue;
        ordersCount += r.ordersCount;
        lifetimeSpend += r.lifetimeSpend;
        if (r.lastSeenAt && (!lastSeenAt || r.lastSeenAt > lastSeenAt)) {
          lastSeenAt = r.lastSeenAt;
        }
      }
    };
    absorb(rollups.byUser, ids.userIds);
    absorb(rollups.byLoyalty, ids.loyaltyIds);
    absorb(rollups.byCredit, ids.creditIds);
    return {
      ordersCount,
      lifetimeSpend: Math.round(lifetimeSpend * 100) / 100,
      lastSeenAt,
    };
  }

  // Admins are cross-branch (optional filter); non-admins are pinned to their
  // own branch and cannot request another. Mirrors the credit-accounts scope.
  private resolveBranchScope(
    actor: AuthUser,
    requested?: string,
  ): string | null {
    if (actor.role === UserRole.ADMIN) return requested ?? null;
    if (!actor.branchId) {
      throw new ForbiddenException('You are not assigned to a branch');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('Cannot access another branch');
    }
    return actor.branchId;
  }
}
