import { ForbiddenException, Injectable } from '@nestjs/common';
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
import type { CustomerSummary } from '@/modules/customers/types';

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

  private toSummary(
    row: CustomerRosterRow,
    rollups: SalesRollupMaps,
  ): CustomerSummary {
    let ordersCount = 0;
    let lifetimeSpend = 0;
    let lastSeenAt: string | null = null;

    const absorb = (map: Map<string, SalesRollup>, ids: string[]): void => {
      for (const id of ids) {
        const r = map.get(id);
        if (!r) continue;
        ordersCount += r.ordersCount;
        lifetimeSpend += r.lifetimeSpend;
        if (r.lastSeenAt && (!lastSeenAt || r.lastSeenAt > lastSeenAt)) {
          lastSeenAt = r.lastSeenAt;
        }
      }
    };
    absorb(rollups.byUser, row.userIds);
    absorb(rollups.byLoyalty, row.loyaltyIds);
    absorb(rollups.byCredit, row.creditIds);

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
      lifetimeSpend: Math.round(lifetimeSpend * 100) / 100,
      lastSeenAt,
      tags: row.tags,
      status: row.status === 'blocked' ? 'blocked' : 'active',
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
