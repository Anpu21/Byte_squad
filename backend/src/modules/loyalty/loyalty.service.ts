import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { LoyaltyRepository } from '@/modules/loyalty/loyalty.repository';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyCustomer } from '@/modules/loyalty/entities/loyalty-customer.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { LoyaltySettings } from '@/modules/loyalty/entities/loyalty-settings.entity';
import { LoyaltySettingsService } from '@/modules/loyalty/loyalty-settings.service';
import { LoyaltyCustomersRepository } from '@/modules/loyalty/loyalty-customers.repository';
import { UsersService } from '@users/users.service';
import { normalizeSriLankaPhone } from '@common/utils/phone.util';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import type {
  LoyaltyCustomerRow,
  LoyaltyHistoryEntry,
  LoyaltyHistoryResponse,
  LoyaltyLookupResult,
  LoyaltyOwner,
} from '@/modules/loyalty/types';
import { ListLoyaltyHistoryQueryDto } from '@/modules/loyalty/dto/list-loyalty-history-query.dto';
import { ListLoyaltyCustomersQueryDto } from '@/modules/loyalty/dto/list-loyalty-customers-query.dto';
import { EnrollWalkInCustomerDto } from '@/modules/loyalty/dto/enroll-walk-in-customer.dto';
import { UpdateWalkInCustomerDto } from '@/modules/loyalty/dto/update-walk-in-customer.dto';
import { AdjustLoyaltyPointsDto } from '@/modules/loyalty/dto/adjust-loyalty-points.dto';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';

export interface LoyaltySummary {
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  tier: LoyaltyTier;
}

export interface LoyaltyCustomersResponse {
  rows: LoyaltyCustomerRow[];
  total: number;
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly loyalty: LoyaltyRepository,
    private readonly settings: LoyaltySettingsService,
    private readonly loyaltyCustomers: LoyaltyCustomersRepository,
    @Inject(forwardRef(() => UsersService))
    private readonly users: UsersService,
  ) {}

  /**
   * Returns the loyalty wallet for either an online user or a
   * walk-in customer. Creates the row on first access so callers
   * don't have to special-case "wallet doesn't exist yet". Exactly
   * one of `owner.userId` / `owner.loyaltyCustomerId` must be set;
   * the `LoyaltyOwner` discriminated union makes the wrong shape a
   * compile-time error, and the runtime guard keeps any unsafe
   * cast from corrupting the wallet.
   */
  async getOrCreateAccount(
    owner: LoyaltyOwner,
    manager?: EntityManager,
  ): Promise<LoyaltyAccount> {
    if (owner.userId) {
      const existing = await this.loyalty.findAccountByUser(
        owner.userId,
        manager,
      );
      if (existing) return existing;
      return this.loyalty.createAccountForUser(owner.userId, manager);
    }
    if (owner.loyaltyCustomerId) {
      const existing = await this.loyalty.findAccountByLoyaltyCustomer(
        owner.loyaltyCustomerId,
        manager,
      );
      if (existing) return existing;
      return this.loyalty.createAccountForLoyaltyCustomer(
        owner.loyaltyCustomerId,
        manager,
      );
    }
    throw new BadRequestException(
      'LoyaltyOwner requires either userId or loyaltyCustomerId',
    );
  }

  async getSummary(userId: string): Promise<LoyaltySummary> {
    const account = await this.getOrCreateAccount({ userId });
    const settings = await this.settings.get();
    return {
      pointsBalance: account.pointsBalance,
      lifetimePointsEarned: account.lifetimePointsEarned,
      lifetimePointsRedeemed: account.lifetimePointsRedeemed,
      tier: this.resolveTier(account.lifetimePointsEarned, settings),
    };
  }

  async getSettings(): Promise<LoyaltySettings> {
    return this.settings.get();
  }

  async listHistory(
    userId: string,
    query: ListLoyaltyHistoryQueryDto,
  ): Promise<LoyaltyHistoryResponse> {
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const offset = Math.max(query.offset ?? 0, 0);

    const { rows, total } = await this.loyalty.listEntries(
      userId,
      limit,
      offset,
    );

    return { entries: this.toHistoryEntries(rows), total, limit, offset };
  }

  async listCustomers(
    query: ListLoyaltyCustomersQueryDto,
  ): Promise<LoyaltyCustomersResponse> {
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const offset = Math.max(query.offset ?? 0, 0);

    if (
      query.minPoints !== undefined &&
      query.maxPoints !== undefined &&
      query.minPoints > query.maxPoints
    ) {
      throw new BadRequestException('minPoints cannot exceed maxPoints');
    }

    const settings = await this.settings.get();
    const { rows, total } = await this.loyalty.listCustomerAccounts({
      search: query.search,
      branchId: query.branchId,
      activeSince: query.activeSince,
      minPoints: query.minPoints,
      maxPoints: query.maxPoints,
      limit,
      offset,
    });
    return {
      rows: rows.map((row) => ({
        ...row,
        tier: this.resolveTier(row.lifetimePointsEarned, settings),
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Branch-scoped customer list for the cashier/manager POS surface.
   * Non-admins are pinned to their own branch (admins may span all or
   * filter to one), then it reuses `listCustomers`. Branch scoping now
   * includes walk-ins whose home branch matches, so a freshly enrolled
   * member appears before their first sale.
   */
  async listBranchCustomers(
    query: ListLoyaltyCustomersQueryDto,
    actor: AuthUser,
  ): Promise<LoyaltyCustomersResponse> {
    const branchId = this.resolveBranchScope(actor, query.branchId);
    return this.listCustomers({ ...query, branchId: branchId ?? undefined });
  }

  /**
   * Points ledger for a single loyalty account (walk-in OR registered
   * user — walk-ins have no `userId`, so this keys on the account id).
   * Non-admins may only read a member tied to their own branch (home
   * branch or ledger activity); admins may read any.
   */
  async getMemberHistory(
    ownerId: string,
    actor: AuthUser,
    query: ListLoyaltyHistoryQueryDto,
  ): Promise<LoyaltyHistoryResponse> {
    // `ownerId` is the list row's id — a userId (registered customer) OR a
    // loyaltyCustomerId (walk-in). Resolve whichever account owns it.
    const account =
      (await this.loyalty.findAccountByUser(ownerId)) ??
      (await this.loyalty.findAccountByLoyaltyCustomer(ownerId));
    if (!account) {
      throw new NotFoundException('Loyalty account not found');
    }

    if (actor.role !== UserRole.ADMIN) {
      if (!actor.branchId) {
        throw new ForbiddenException('You are not assigned to a branch');
      }
      const accessible = await this.accountBelongsToBranch(
        account,
        actor.branchId,
      );
      if (!accessible) {
        throw new ForbiddenException(
          'You do not have access to this loyalty member',
        );
      }
    }

    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const offset = Math.max(query.offset ?? 0, 0);
    const { rows, total } = await this.loyalty.listEntriesByOwner(
      { userId: account.userId, loyaltyCustomerId: account.loyaltyCustomerId },
      limit,
      offset,
    );
    return { entries: this.toHistoryEntries(rows), total, limit, offset };
  }

  async getPointValue(): Promise<number> {
    const settings = await this.settings.get();
    return settings.pointValue > 0 ? settings.pointValue : 1;
  }

  /**
   * Resolves a phone number to a loyalty wallet summary. User-side
   * (registered customer) always wins over a walk-in record so an
   * existing online account stays the primary identity even if a
   * walk-in row was created earlier under a slightly different
   * format of the same phone.
   */
  async lookupByPhone(rawPhone: string): Promise<LoyaltyLookupResult> {
    const normalized = normalizeSriLankaPhone(rawPhone);
    if (!normalized) {
      throw new BadRequestException('Invalid phone number');
    }

    const user = await this.users.findByPhone(normalized);
    if (user) {
      const account = await this.getOrCreateAccount({ userId: user.id });
      const settings = await this.settings.get();
      return {
        ownerType: 'user',
        userId: user.id,
        loyaltyCustomerId: null,
        tier: this.resolveTier(account.lifetimePointsEarned, settings),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: normalized,
        pointsBalance: account.pointsBalance,
        lifetimePointsEarned: account.lifetimePointsEarned,
        lifetimePointsRedeemed: account.lifetimePointsRedeemed,
      };
    }

    const walkIn = await this.loyaltyCustomers.findByPhone(normalized);
    if (walkIn) {
      const account = await this.getOrCreateAccount({
        loyaltyCustomerId: walkIn.id,
      });
      const settings = await this.settings.get();
      return {
        ownerType: 'walkIn',
        userId: null,
        loyaltyCustomerId: walkIn.id,
        tier: this.resolveTier(account.lifetimePointsEarned, settings),
        firstName: walkIn.firstName,
        lastName: walkIn.lastName,
        phone: normalized,
        pointsBalance: account.pointsBalance,
        lifetimePointsEarned: account.lifetimePointsEarned,
        lifetimePointsRedeemed: account.lifetimePointsRedeemed,
      };
    }

    throw new NotFoundException(
      'No loyalty account found for this phone number',
    );
  }

  /**
   * Creates a walk-in `LoyaltyCustomer` row + matching wallet in
   * one step. Phone collisions against either side (registered
   * user or existing walk-in) are rejected — the cashier UI should
   * call `lookupByPhone` first and only land here when that 404s.
   */
  async enrollWalkInCustomer(
    dto: EnrollWalkInCustomerDto,
    actor: AuthUser,
  ): Promise<LoyaltyLookupResult> {
    const normalized = normalizeSriLankaPhone(dto.phone);
    if (!normalized) {
      throw new BadRequestException('Invalid phone number');
    }

    const existingUser = await this.users.findByPhone(normalized);
    if (existingUser) {
      throw new BadRequestException(
        'Phone already linked to a registered account',
      );
    }

    const existingWalkIn = await this.loyaltyCustomers.findByPhone(normalized);
    if (existingWalkIn) {
      throw new BadRequestException('Walk-in already enrolled');
    }

    const firstName = dto.firstName.trim();
    const lastNameTrimmed = dto.lastName?.trim();
    const lastName =
      lastNameTrimmed && lastNameTrimmed.length > 0 ? lastNameTrimmed : null;

    const created = await this.loyaltyCustomers.create({
      phone: normalized,
      firstName,
      lastName,
      branchId: actor.branchId ?? null,
    });

    const account = await this.getOrCreateAccount({
      loyaltyCustomerId: created.id,
    });
    const settings = await this.settings.get();

    return {
      ownerType: 'walkIn',
      userId: null,
      loyaltyCustomerId: created.id,
      tier: this.resolveTier(account.lifetimePointsEarned, settings),
      firstName: created.firstName,
      lastName: created.lastName,
      phone: created.phone,
      pointsBalance: account.pointsBalance,
      lifetimePointsEarned: account.lifetimePointsEarned,
      lifetimePointsRedeemed: account.lifetimePointsRedeemed,
    };
  }

  /**
   * Edits a walk-in member's name/phone. A changed phone is normalized and
   * rejected if it collides with a registered user or another walk-in.
   * Non-admins may only edit a walk-in homed in their own branch.
   */
  async updateWalkInCustomer(
    id: string,
    dto: UpdateWalkInCustomerDto,
    actor: AuthUser,
  ): Promise<LoyaltyLookupResult> {
    const walkIn = await this.loyaltyCustomers.findById(id);
    if (!walkIn) {
      throw new NotFoundException('Walk-in customer not found');
    }

    if (actor.role !== UserRole.ADMIN) {
      if (!actor.branchId) {
        throw new ForbiddenException('You are not assigned to a branch');
      }
      if (walkIn.branchId !== actor.branchId) {
        throw new ForbiddenException('You do not have access to this walk-in');
      }
    }

    const patch: Partial<
      Pick<LoyaltyCustomer, 'phone' | 'firstName' | 'lastName'>
    > = {};

    if (dto.phone !== undefined) {
      const normalized = normalizeSriLankaPhone(dto.phone);
      if (!normalized) {
        throw new BadRequestException('Invalid phone number');
      }
      if (normalized !== walkIn.phone) {
        const existingUser = await this.users.findByPhone(normalized);
        if (existingUser) {
          throw new BadRequestException(
            'Phone already linked to a registered account',
          );
        }
        const otherWalkIn = await this.loyaltyCustomers.findByPhone(normalized);
        if (otherWalkIn && otherWalkIn.id !== id) {
          throw new BadRequestException(
            'Another walk-in already uses this phone',
          );
        }
        patch.phone = normalized;
      }
    }
    if (dto.firstName !== undefined) patch.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) {
      const trimmed = dto.lastName.trim();
      patch.lastName = trimmed.length > 0 ? trimmed : null;
    }

    const current =
      Object.keys(patch).length > 0
        ? ((await this.loyaltyCustomers.update(id, patch)) ?? walkIn)
        : walkIn;

    // Build the wallet result directly (not via lookupByPhone) so a legacy
    // walk-in with a malformed stored phone can still be renamed.
    const account = await this.getOrCreateAccount({ loyaltyCustomerId: id });
    const settings = await this.settings.get();
    return {
      ownerType: 'walkIn',
      userId: null,
      loyaltyCustomerId: current.id,
      tier: this.resolveTier(account.lifetimePointsEarned, settings),
      firstName: current.firstName,
      lastName: current.lastName,
      phone: current.phone,
      pointsBalance: account.pointsBalance,
      lifetimePointsEarned: account.lifetimePointsEarned,
      lifetimePointsRedeemed: account.lifetimePointsRedeemed,
    };
  }

  /**
   * Public entry point for the customer-hub merge: fold a walk-in wallet + its
   * sales/ledger history into a registered user (delegates to the transactional
   * repository merge, which also writes a MERGE_TRANSFER audit entry).
   */
  async mergeWalkIn(userId: string, loyaltyCustomerId: string): Promise<void> {
    await this.loyalty.mergeWalkInIntoUser({ userId, loyaltyCustomerId });
  }

  async syncVerifiedUserByPhone(userId: string): Promise<LoyaltyAccount> {
    const user = await this.users.findEntityById(userId);
    if (!user?.phone) {
      return this.getOrCreateAccount({ userId });
    }

    const normalized = normalizeSriLankaPhone(user.phone);
    if (!normalized) {
      return this.getOrCreateAccount({ userId });
    }

    const walkIn = await this.loyaltyCustomers.findByPhone(normalized);
    if (!walkIn) {
      return this.getOrCreateAccount({ userId });
    }

    return this.loyalty.mergeWalkInIntoUser({
      userId,
      loyaltyCustomerId: walkIn.id,
    });
  }

  async getDashboardStats(branchId?: string) {
    return this.loyalty.getDashboardStats(branchId);
  }

  /**
   * Manual adjustment for any member (registered user OR walk-in).
   * `memberId` is the directory row id — a userId or a
   * loyaltyCustomerId; the wallet is resolved from whichever side
   * owns it and is never auto-created here (adjusting a non-member
   * is a 404, not an enrol). Non-admin actors may only adjust
   * members tied to their own branch; the ledger entry records the
   * acting role and branch.
   */
  async adjustPoints(
    memberId: string,
    dto: AdjustLoyaltyPointsDto,
    actor: AuthUser,
  ): Promise<void> {
    const account =
      (await this.loyalty.findAccountByUser(memberId)) ??
      (await this.loyalty.findAccountByLoyaltyCustomer(memberId));
    if (!account) {
      throw new NotFoundException('Loyalty account not found');
    }

    if (actor.role !== UserRole.ADMIN) {
      if (!actor.branchId) {
        throw new ForbiddenException('You are not assigned to a branch');
      }
      const accessible = await this.accountBelongsToBranch(
        account,
        actor.branchId,
      );
      if (!accessible) {
        throw new ForbiddenException(
          'You do not have access to this loyalty member',
        );
      }
    }

    if (dto.points < 0 && account.pointsBalance + dto.points < 0) {
      throw new BadRequestException(
        'Cannot deduct more points than the current balance',
      );
    }

    const owner: LoyaltyOwner | null = account.userId
      ? { userId: account.userId }
      : account.loyaltyCustomerId
        ? { loyaltyCustomerId: account.loyaltyCustomerId }
        : null;
    if (!owner) {
      throw new BadRequestException('Loyalty account has no owner');
    }

    await this.loyalty.applyManualAdjustment(owner, dto.points);
    await this.loyalty.createLedgerEntry({
      userId: account.userId,
      loyaltyCustomerId: account.loyaltyCustomerId,
      branchId: actor.branchId ?? null,
      orderId: null,
      type: LoyaltyLedgerEntryType.ADJUSTED,
      points: dto.points,
      description: dto.reason,
      metadata: { adjustedByRole: actor.role, adjustedById: actor.id },
    });
  }

  /** Map ledger rows to the wire history shape (shared by both history paths). */
  private toHistoryEntries(rows: LoyaltyLedgerEntry[]): LoyaltyHistoryEntry[] {
    return rows.map((row) => {
      const code = row.metadata?.orderCode;
      return {
        id: row.id,
        type: row.type,
        points: row.points,
        description: row.description,
        orderCode: typeof code === 'string' ? code : null,
        createdAt: row.createdAt,
      };
    });
  }

  /** Admin may span all branches (null) or filter to one; others pinned. */
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

  /** A member is "in" a branch if homed there (walk-in) or active there. */
  private async accountBelongsToBranch(
    account: LoyaltyAccount,
    branchId: string,
  ): Promise<boolean> {
    if (account.loyaltyCustomerId) {
      const walkIn = await this.loyaltyCustomers.findById(
        account.loyaltyCustomerId,
      );
      if (walkIn?.branchId === branchId) return true;
    }
    return this.loyalty.hasLedgerAtBranch(
      { userId: account.userId, loyaltyCustomerId: account.loyaltyCustomerId },
      branchId,
    );
  }

  private resolveTier(
    lifetimePointsEarned: number,
    settings: LoyaltySettings,
  ): LoyaltyTier {
    if (lifetimePointsEarned >= settings.goldTierPoints) return 'gold';
    if (lifetimePointsEarned >= settings.silverTierPoints) return 'silver';
    return 'bronze';
  }
}
