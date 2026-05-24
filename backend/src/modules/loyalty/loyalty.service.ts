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
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';
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

  async calculateMaxRedeemable(
    subtotal: number,
    availablePoints: number,
  ): Promise<number> {
    const settings = await this.settings.get();
    const value = settings.pointValue > 0 ? settings.pointValue : 1;
    const capLkr = (subtotal * settings.redeemCapPercent) / 100;
    const pointsForCap = Math.floor(capLkr / value);
    return Math.max(0, Math.min(availablePoints, pointsForCap));
  }

  async calculateEarnedPoints(paidAmount: number): Promise<number> {
    const settings = await this.settings.get();
    if (settings.earnPerAmount <= 0 || settings.earnPoints <= 0) return 0;
    return Math.max(
      0,
      Math.floor((paidAmount / settings.earnPerAmount) * settings.earnPoints),
    );
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

  async redeemForOrder(params: {
    owner: LoyaltyOwner;
    orderId: string;
    orderCode: string;
    subtotal: number;
    requestedPoints: number;
    branchId?: string | null;
  }): Promise<number> {
    const requestedPoints = Math.floor(params.requestedPoints);
    if (requestedPoints <= 0) return 0;

    const account = await this.getOrCreateAccount(params.owner);
    const max = await this.calculateMaxRedeemable(
      params.subtotal,
      account.pointsBalance,
    );
    if (requestedPoints > max) {
      throw new BadRequestException(
        `You can redeem up to ${max} points on this order`,
      );
    }

    const alreadyRedeemed = await this.loyalty.findLedgerEntry(
      params.owner,
      params.orderId,
      LoyaltyLedgerEntryType.REDEEMED,
    );
    if (alreadyRedeemed) return alreadyRedeemed.points;

    const applied = await this.loyalty.applyRedeem(
      params.owner,
      requestedPoints,
    );
    if (!applied) {
      throw new BadRequestException('Not enough loyalty points');
    }

    await this.loyalty.createLedgerEntry({
      userId: params.owner.userId ?? null,
      loyaltyCustomerId: params.owner.loyaltyCustomerId ?? null,
      branchId: params.branchId ?? null,
      orderId: params.orderId,
      type: LoyaltyLedgerEntryType.REDEEMED,
      points: requestedPoints,
      description: `Redeemed points for order ${params.orderCode}`,
      metadata: { orderCode: params.orderCode },
    });

    return requestedPoints;
  }

  async reverseRedemption(params: {
    owner: LoyaltyOwner;
    orderId: string;
    orderCode: string;
    branchId?: string | null;
  }): Promise<number> {
    const redeemed = await this.loyalty.findLedgerEntry(
      params.owner,
      params.orderId,
      LoyaltyLedgerEntryType.REDEEMED,
    );
    if (!redeemed) return 0;

    const reversed = await this.loyalty.findLedgerEntry(
      params.owner,
      params.orderId,
      LoyaltyLedgerEntryType.REVERSED,
    );
    if (reversed) return 0;

    await this.loyalty.applyRedeemReversal(params.owner, redeemed.points);
    await this.loyalty.createLedgerEntry({
      userId: params.owner.userId ?? null,
      loyaltyCustomerId: params.owner.loyaltyCustomerId ?? null,
      branchId: params.branchId ?? null,
      orderId: params.orderId,
      type: LoyaltyLedgerEntryType.REVERSED,
      points: redeemed.points,
      description: `Reversed redeemed points for order ${params.orderCode}`,
      metadata: { orderCode: params.orderCode },
    });
    return redeemed.points;
  }

  async awardForOrder(params: {
    owner: LoyaltyOwner | null;
    orderId: string;
    orderCode: string;
    paidAmount: number;
    branchId?: string | null;
  }): Promise<number> {
    if (!params.owner) return 0;
    const points = await this.calculateEarnedPoints(params.paidAmount);
    if (points <= 0) return 0;

    await this.getOrCreateAccount(params.owner);

    const existing = await this.loyalty.findLedgerEntry(
      params.owner,
      params.orderId,
      LoyaltyLedgerEntryType.EARNED,
    );
    if (existing) return existing.points;

    await this.loyalty.applyEarn(params.owner, points);
    await this.loyalty.createLedgerEntry({
      userId: params.owner.userId ?? null,
      loyaltyCustomerId: params.owner.loyaltyCustomerId ?? null,
      branchId: params.branchId ?? null,
      orderId: params.orderId,
      type: LoyaltyLedgerEntryType.EARNED,
      points,
      description: `Earned points for order ${params.orderCode}`,
      metadata: { orderCode: params.orderCode, paidAmount: params.paidAmount },
    });
    return points;
  }
}
