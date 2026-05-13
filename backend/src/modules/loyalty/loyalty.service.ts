import { BadRequestException, Injectable } from '@nestjs/common';
import { LoyaltyRepository } from '@/modules/loyalty/loyalty.repository';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';
import type {
  LoyaltyHistoryEntry,
  LoyaltyHistoryResponse,
} from '@/modules/loyalty/types';
import { ListLoyaltyHistoryQueryDto } from '@/modules/loyalty/dto/list-loyalty-history-query.dto';

export interface LoyaltySummary {
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class LoyaltyService {
  constructor(private readonly loyalty: LoyaltyRepository) {}

  async getOrCreateAccount(userId: string): Promise<LoyaltyAccount> {
    const existing = await this.loyalty.findAccountByUser(userId);
    if (existing) return existing;
    return this.loyalty.createAccount(userId);
  }

  async getSummary(userId: string): Promise<LoyaltySummary> {
    const account = await this.getOrCreateAccount(userId);
    return {
      pointsBalance: account.pointsBalance,
      lifetimePointsEarned: account.lifetimePointsEarned,
      lifetimePointsRedeemed: account.lifetimePointsRedeemed,
    };
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

  calculateMaxRedeemable(subtotal: number, availablePoints: number): number {
    return Math.max(0, Math.min(availablePoints, Math.floor(subtotal * 0.2)));
  }

  calculateEarnedPoints(paidAmount: number): number {
    return Math.max(0, Math.floor(paidAmount / 100));
  }

  async redeemForOrder(params: {
    userId: string;
    orderId: string;
    orderCode: string;
    subtotal: number;
    requestedPoints: number;
  }): Promise<number> {
    const requestedPoints = Math.floor(params.requestedPoints);
    if (requestedPoints <= 0) return 0;

    const account = await this.getOrCreateAccount(params.userId);
    const max = this.calculateMaxRedeemable(
      params.subtotal,
      account.pointsBalance,
    );
    if (requestedPoints > max) {
      throw new BadRequestException(
        `You can redeem up to ${max} points on this order`,
      );
    }

    const alreadyRedeemed = await this.loyalty.findLedgerEntry(
      params.userId,
      params.orderId,
      LoyaltyLedgerEntryType.REDEEMED,
    );
    if (alreadyRedeemed) return alreadyRedeemed.points;

    const applied = await this.loyalty.applyRedeem(
      params.userId,
      requestedPoints,
    );
    if (!applied) {
      throw new BadRequestException('Not enough loyalty points');
    }

    await this.loyalty.createLedgerEntry({
      userId: params.userId,
      orderId: params.orderId,
      type: LoyaltyLedgerEntryType.REDEEMED,
      points: requestedPoints,
      description: `Redeemed points for order ${params.orderCode}`,
      metadata: { orderCode: params.orderCode },
    });

    return requestedPoints;
  }

  async reverseRedemption(params: {
    userId: string;
    orderId: string;
    orderCode: string;
  }): Promise<number> {
    const redeemed = await this.loyalty.findLedgerEntry(
      params.userId,
      params.orderId,
      LoyaltyLedgerEntryType.REDEEMED,
    );
    if (!redeemed) return 0;

    const reversed = await this.loyalty.findLedgerEntry(
      params.userId,
      params.orderId,
      LoyaltyLedgerEntryType.REVERSED,
    );
    if (reversed) return 0;

    await this.loyalty.applyRedeemReversal(params.userId, redeemed.points);
    await this.loyalty.createLedgerEntry({
      userId: params.userId,
      orderId: params.orderId,
      type: LoyaltyLedgerEntryType.REVERSED,
      points: redeemed.points,
      description: `Reversed redeemed points for order ${params.orderCode}`,
      metadata: { orderCode: params.orderCode },
    });
    return redeemed.points;
  }

  async awardForOrder(params: {
    userId: string | null;
    orderId: string;
    orderCode: string;
    paidAmount: number;
  }): Promise<number> {
    if (!params.userId) return 0;
    const points = this.calculateEarnedPoints(params.paidAmount);
    if (points <= 0) return 0;

    await this.getOrCreateAccount(params.userId);

    const existing = await this.loyalty.findLedgerEntry(
      params.userId,
      params.orderId,
      LoyaltyLedgerEntryType.EARNED,
    );
    if (existing) return existing.points;

    await this.loyalty.applyEarn(params.userId, points);
    await this.loyalty.createLedgerEntry({
      userId: params.userId,
      orderId: params.orderId,
      type: LoyaltyLedgerEntryType.EARNED,
      points,
      description: `Earned points for order ${params.orderCode}`,
      metadata: { orderCode: params.orderCode, paidAmount: params.paidAmount },
    });
    return points;
  }
}
