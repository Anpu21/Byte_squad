import { BadRequestException, Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
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
    const redeemableBalance = Math.max(
      0,
      availablePoints - settings.minRedeemablePoints,
    );
    return Math.max(0, Math.min(redeemableBalance, pointsForCap));
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
    manager?: EntityManager;
  }): Promise<number> {
    const requestedPoints = Math.floor(params.requestedPoints);
    if (requestedPoints <= 0) return 0;

    const account = await this.loyaltyService.getOrCreateAccount(
      params.owner,
      params.manager,
    );
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
      params.manager,
    );
    if (alreadyRedeemed) return alreadyRedeemed.points;

    const applied = await this.loyalty.applyRedeem(
      params.owner,
      requestedPoints,
      params.manager,
    );
    if (!applied) {
      throw new BadRequestException('Not enough loyalty points');
    }

    await this.loyalty.createLedgerEntry(
      {
        userId: params.owner.userId ?? null,
        loyaltyCustomerId: params.owner.loyaltyCustomerId ?? null,
        branchId: params.branchId ?? null,
        orderId: params.orderId,
        type: LoyaltyLedgerEntryType.REDEEMED,
        points: requestedPoints,
        description: `Redeemed points for order ${params.orderCode}`,
        metadata: { orderCode: params.orderCode },
      },
      params.manager,
    );

    return requestedPoints;
  }

  async reverseRedemption(params: {
    owner: LoyaltyOwner;
    orderId: string;
    orderCode: string;
    branchId?: string | null;
    manager?: EntityManager;
  }): Promise<number> {
    const redeemed = await this.loyalty.findLedgerEntry(
      params.owner,
      params.orderId,
      LoyaltyLedgerEntryType.REDEEMED,
      params.manager,
    );
    if (!redeemed) return 0;

    const reversed = await this.loyalty.findLedgerEntry(
      params.owner,
      params.orderId,
      LoyaltyLedgerEntryType.REVERSED,
      params.manager,
    );
    if (reversed) return 0;

    await this.loyalty.applyRedeemReversal(
      params.owner,
      redeemed.points,
      params.manager,
    );
    await this.loyalty.createLedgerEntry(
      {
        userId: params.owner.userId ?? null,
        loyaltyCustomerId: params.owner.loyaltyCustomerId ?? null,
        branchId: params.branchId ?? null,
        orderId: params.orderId,
        type: LoyaltyLedgerEntryType.REVERSED,
        points: redeemed.points,
        description: `Reversed redeemed points for order ${params.orderCode}`,
        metadata: { orderCode: params.orderCode },
      },
      params.manager,
    );
    return redeemed.points;
  }

  async reverseEarnForOrder(params: {
    owner: LoyaltyOwner;
    orderId: string;
    orderCode: string;
    branchId?: string | null;
    manager?: EntityManager;
  }): Promise<number> {
    const earned = await this.loyalty.findLedgerEntry(
      params.owner,
      params.orderId,
      LoyaltyLedgerEntryType.EARNED,
      params.manager,
    );
    if (!earned) return 0;

    const reversed = await this.loyalty.findLedgerEntry(
      params.owner,
      params.orderId,
      LoyaltyLedgerEntryType.EARN_REVERSED,
      params.manager,
    );
    if (reversed) return 0;

    await this.loyalty.applyEarnReversal(
      params.owner,
      earned.points,
      params.manager,
    );
    await this.loyalty.createLedgerEntry(
      {
        userId: params.owner.userId ?? null,
        loyaltyCustomerId: params.owner.loyaltyCustomerId ?? null,
        branchId: params.branchId ?? null,
        orderId: params.orderId,
        type: LoyaltyLedgerEntryType.EARN_REVERSED,
        points: earned.points,
        description: `Reversed earned points for order ${params.orderCode}`,
        metadata: { orderCode: params.orderCode },
      },
      params.manager,
    );
    return earned.points;
  }

  async reverseOrderEffects(params: {
    owner: LoyaltyOwner | null;
    orderId: string;
    orderCode: string;
    branchId?: string | null;
    manager?: EntityManager;
  }): Promise<{ earnedReversed: number; redeemedRestored: number }> {
    if (!params.owner) {
      return { earnedReversed: 0, redeemedRestored: 0 };
    }
    const earnedReversed = await this.reverseEarnForOrder({
      owner: params.owner,
      orderId: params.orderId,
      orderCode: params.orderCode,
      branchId: params.branchId,
      manager: params.manager,
    });
    const redeemedRestored = await this.reverseRedemption({
      owner: params.owner,
      orderId: params.orderId,
      orderCode: params.orderCode,
      branchId: params.branchId,
      manager: params.manager,
    });
    return { earnedReversed, redeemedRestored };
  }

  async awardForOrder(params: {
    owner: LoyaltyOwner | null;
    orderId: string;
    orderCode: string;
    paidAmount: number;
    branchId?: string | null;
    manager?: EntityManager;
  }): Promise<number> {
    if (!params.owner) return 0;
    const points = await this.calculateEarnedPoints(params.paidAmount);
    if (points <= 0) return 0;

    await this.loyaltyService.getOrCreateAccount(params.owner, params.manager);

    const existing = await this.loyalty.findLedgerEntry(
      params.owner,
      params.orderId,
      LoyaltyLedgerEntryType.EARNED,
      params.manager,
    );
    if (existing) return existing.points;

    await this.loyalty.applyEarn(params.owner, points, params.manager);
    await this.loyalty.createLedgerEntry(
      {
        userId: params.owner.userId ?? null,
        loyaltyCustomerId: params.owner.loyaltyCustomerId ?? null,
        branchId: params.branchId ?? null,
        orderId: params.orderId,
        type: LoyaltyLedgerEntryType.EARNED,
        points,
        description: `Earned points for order ${params.orderCode}`,
        metadata: {
          orderCode: params.orderCode,
          paidAmount: params.paidAmount,
        },
      },
      params.manager,
    );
    return points;
  }
}
