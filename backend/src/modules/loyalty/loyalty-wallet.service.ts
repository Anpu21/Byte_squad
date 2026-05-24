import { BadRequestException, Injectable } from '@nestjs/common';
import { LoyaltyRepository } from '@/modules/loyalty/loyalty.repository';
import { LoyaltySettingsService } from '@/modules/loyalty/loyalty-settings.service';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';
import type { LoyaltyOwner } from '@/modules/loyalty/types';

/**
 * Wallet write path for loyalty: earn, redeem, reverse, and the
 * supporting calculation helpers. Split out of `LoyaltyService` so
 * the lookup / enroll / summary surface stays small and so callers
 * that only need the write path don't drag the rest of the surface
 * area through their dependency graph.
 *
 * `LoyaltyService.getOrCreateAccount` is reused here because the
 * polymorphic owner resolution is the same regardless of whether
 * we are reading or writing.
 */
@Injectable()
export class LoyaltyWalletService {
  constructor(
    private readonly loyalty: LoyaltyRepository,
    private readonly settings: LoyaltySettingsService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

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

    const account = await this.loyaltyService.getOrCreateAccount(params.owner);
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

    await this.loyaltyService.getOrCreateAccount(params.owner);

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
