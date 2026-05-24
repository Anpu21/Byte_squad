import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoyaltyRepository } from '@/modules/loyalty/loyalty.repository';
import type { LoyaltyCustomerRow } from '@/modules/loyalty/loyalty.repository';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltySettings } from '@/modules/loyalty/entities/loyalty-settings.entity';
import { LoyaltySettingsService } from '@/modules/loyalty/loyalty-settings.service';
import { LoyaltyCustomersRepository } from '@/modules/loyalty/loyalty-customers.repository';
import { UsersRepository } from '@users/users.repository';
import { normalizeSriLankaPhone } from '@common/utils/phone.util';
import type {
  LoyaltyHistoryEntry,
  LoyaltyHistoryResponse,
  LoyaltyLookupResult,
  LoyaltyOwner,
} from '@/modules/loyalty/types';
import { ListLoyaltyHistoryQueryDto } from '@/modules/loyalty/dto/list-loyalty-history-query.dto';
import { ListLoyaltyCustomersQueryDto } from '@/modules/loyalty/dto/list-loyalty-customers-query.dto';
import { EnrollWalkInCustomerDto } from '@/modules/loyalty/dto/enroll-walk-in-customer.dto';

export interface LoyaltySummary {
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
}

export interface LoyaltyCustomersResponse {
  rows: LoyaltyCustomerRow[];
  total: number;
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly loyalty: LoyaltyRepository,
    private readonly settings: LoyaltySettingsService,
    private readonly loyaltyCustomers: LoyaltyCustomersRepository,
    private readonly users: UsersRepository,
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
  async getOrCreateAccount(owner: LoyaltyOwner): Promise<LoyaltyAccount> {
    if (owner.userId) {
      const existing = await this.loyalty.findAccountByUser(owner.userId);
      if (existing) return existing;
      return this.loyalty.createAccountForUser(owner.userId);
    }
    if (owner.loyaltyCustomerId) {
      const existing = await this.loyalty.findAccountByLoyaltyCustomer(
        owner.loyaltyCustomerId,
      );
      if (existing) return existing;
      return this.loyalty.createAccountForLoyaltyCustomer(
        owner.loyaltyCustomerId,
      );
    }
    throw new BadRequestException(
      'LoyaltyOwner requires either userId or loyaltyCustomerId',
    );
  }

  async getSummary(userId: string): Promise<LoyaltySummary> {
    const account = await this.getOrCreateAccount({ userId });
    return {
      pointsBalance: account.pointsBalance,
      lifetimePointsEarned: account.lifetimePointsEarned,
      lifetimePointsRedeemed: account.lifetimePointsRedeemed,
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

    const entries: LoyaltyHistoryEntry[] = rows.map((row) => ({
      id: row.id,
      type: row.type,
      points: row.points,
      description: row.description,
      orderCode: row.order?.orderCode ?? null,
      createdAt: row.createdAt,
    }));

    return { entries, total, limit, offset };
  }

  async listCustomers(
    query: ListLoyaltyCustomersQueryDto,
  ): Promise<LoyaltyCustomersResponse> {
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const offset = Math.max(query.offset ?? 0, 0);
    const { rows, total } = await this.loyalty.listCustomerAccounts({
      search: query.search,
      limit,
      offset,
    });
    return { rows, total, limit, offset };
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
      return {
        ownerType: 'user',
        userId: user.id,
        loyaltyCustomerId: null,
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
      return {
        ownerType: 'walkIn',
        userId: null,
        loyaltyCustomerId: walkIn.id,
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
    });

    const account = await this.getOrCreateAccount({
      loyaltyCustomerId: created.id,
    });

    return {
      ownerType: 'walkIn',
      userId: null,
      loyaltyCustomerId: created.id,
      firstName: created.firstName,
      lastName: created.lastName,
      phone: created.phone,
      pointsBalance: account.pointsBalance,
      lifetimePointsEarned: account.lifetimePointsEarned,
      lifetimePointsRedeemed: account.lifetimePointsRedeemed,
    };
  }
}
