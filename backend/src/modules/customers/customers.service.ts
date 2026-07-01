import {
  BadRequestException,
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
import { UpdateCustomerProfileDto } from '@/modules/customers/dto/update-customer-profile.dto';
import { computeCustomerAnalytics } from '@/modules/customers/lib/customer-analytics.util';
import { CustomerProfilesRepository } from '@/modules/customers/customer-profiles.repository';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import {
  CustomersRepository,
  type CustomerRosterRow,
  type SalesRollup,
  type SalesRollupMaps,
} from '@/modules/customers/customers.repository';
import type {
  CustomerAnalytics,
  CustomerProfileDetail,
  CustomerSummary,
} from '@/modules/customers/types';

@Injectable()
export class CustomersService {
  constructor(
    private readonly repo: CustomersRepository,
    private readonly profiles: CustomerProfilesRepository,
    private readonly loyalty: LoyaltyService,
  ) {}

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

  /** Update a customer's management metadata (tags / notes / segment / status). */
  async updateProfile(
    key: string,
    dto: UpdateCustomerProfileDto,
    actor: AuthUser,
  ): Promise<CustomerProfileDetail> {
    const branchId = this.resolveBranchScope(actor, undefined);
    const identity = await this.repo.findIdentityByKey(key, branchId);
    if (!identity) {
      throw new NotFoundException('Customer not found');
    }
    const profile = await this.profiles.ensure(key, actor.id);
    if (dto.tags !== undefined) {
      profile.tags = [
        ...new Set(dto.tags.map((t) => t.trim()).filter(Boolean)),
      ];
    }
    if (dto.notes !== undefined) profile.notes = dto.notes.trim() || null;
    if (dto.segment !== undefined) profile.segment = dto.segment.trim() || null;
    if (dto.status !== undefined) profile.status = dto.status;
    await this.profiles.save(profile);
    return this.getProfile(key, actor);
  }

  /** Cross-customer analytics: RFM segments, churn buckets, LTV leaderboard. */
  async getAnalytics(
    actor: AuthUser,
    branchId?: string,
  ): Promise<CustomerAnalytics> {
    const scope = this.resolveBranchScope(actor, branchId);
    const rows = await this.repo.analyticsRows(scope);
    return computeCustomerAnalytics(rows, new Date());
  }

  /**
   * Full-reassign merge: fold a walk-in / khata stitched customer (path key)
   * into an existing registered user. Walk-in wallets + their sales/ledger move
   * via the transactional, audited loyalty merge; khata accounts are re-pointed
   * onto the user. Admin-only and irreversible.
   */
  async merge(
    sourceKey: string,
    targetKey: string,
    actor: AuthUser,
  ): Promise<CustomerProfileDetail> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can merge customers');
    }
    if (sourceKey === targetKey) {
      throw new BadRequestException('Cannot merge a customer into itself');
    }
    const source = await this.repo.findIdentityByKey(sourceKey, null);
    if (!source) {
      throw new NotFoundException('Customer not found');
    }
    if (source.userIds.length > 0) {
      throw new BadRequestException(
        'This customer is already a registered account and cannot be merged',
      );
    }
    if (source.loyaltyIds.length + source.creditIds.length === 0) {
      throw new BadRequestException('This customer has nothing to merge');
    }
    const target = await this.repo.findIdentityByKey(targetKey, null);
    if (!target || target.userIds.length === 0) {
      throw new BadRequestException(
        'Merge target must be a registered customer',
      );
    }
    const targetUserId = target.userIds[0];

    for (const loyaltyId of source.loyaltyIds) {
      await this.loyalty.mergeWalkIn(targetUserId, loyaltyId);
    }
    await this.repo.reassignCreditAccountsToUser(
      source.creditIds,
      targetUserId,
    );

    return this.getProfile(targetKey, actor);
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
