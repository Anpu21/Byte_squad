import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';
import type { LoyaltyOwner } from '@/modules/loyalty/types';

@Injectable()
export class LoyaltyRepository {
  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly accountRepo: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyLedgerEntry)
    private readonly ledgerRepo: Repository<LoyaltyLedgerEntry>,
  ) {}

  async findAccountByUser(userId: string): Promise<LoyaltyAccount | null> {
    return this.accountRepo.findOne({ where: { userId } });
  }

  async findAccountByLoyaltyCustomer(
    loyaltyCustomerId: string,
  ): Promise<LoyaltyAccount | null> {
    return this.accountRepo.findOne({ where: { loyaltyCustomerId } });
  }

  async createAccountForUser(userId: string): Promise<LoyaltyAccount> {
    return this.accountRepo.save(this.accountRepo.create({ userId }));
  }

  async createAccountForLoyaltyCustomer(
    loyaltyCustomerId: string,
  ): Promise<LoyaltyAccount> {
    return this.accountRepo.save(
      this.accountRepo.create({ loyaltyCustomerId }),
    );
  }

  async findLedgerEntry(
    owner: LoyaltyOwner,
    orderId: string,
    type: LoyaltyLedgerEntryType,
  ): Promise<LoyaltyLedgerEntry | null> {
    if (owner.userId) {
      return this.ledgerRepo.findOne({
        where: { userId: owner.userId, orderId, type },
      });
    }
    return this.ledgerRepo.findOne({
      where: {
        loyaltyCustomerId: owner.loyaltyCustomerId,
        orderId,
        type,
      },
    });
  }

  async createLedgerEntry(
    partial: DeepPartial<LoyaltyLedgerEntry>,
  ): Promise<LoyaltyLedgerEntry> {
    return this.ledgerRepo.save(this.ledgerRepo.create(partial));
  }

  /**
   * Atomic debit against the owner's wallet. Returns false if the
   * wallet doesn't have enough points (the UPDATE … WHERE
   * points_balance >= :points clause keeps the redeem race-free).
   */
  async applyRedeem(owner: LoyaltyOwner, points: number): Promise<boolean> {
    const qb = this.accountRepo
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `"points_balance" - ${points}`,
        lifetimePointsRedeemed: () => `"lifetime_points_redeemed" + ${points}`,
      })
      .andWhere('points_balance >= :points', { points });

    if (owner.userId) {
      qb.where('user_id = :userId', { userId: owner.userId });
    } else {
      qb.where('loyalty_customer_id = :loyaltyCustomerId', {
        loyaltyCustomerId: owner.loyaltyCustomerId,
      });
    }

    const result = await qb.execute();
    return Number(result.affected ?? 0) > 0;
  }

  async applyRedeemReversal(
    owner: LoyaltyOwner,
    points: number,
  ): Promise<void> {
    const qb = this.accountRepo
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `"points_balance" + ${points}`,
        lifetimePointsRedeemed: () => `"lifetime_points_redeemed" - ${points}`,
      });

    if (owner.userId) {
      qb.where('user_id = :userId', { userId: owner.userId });
    } else {
      qb.where('loyalty_customer_id = :loyaltyCustomerId', {
        loyaltyCustomerId: owner.loyaltyCustomerId,
      });
    }

    await qb.execute();
  }

  async applyEarn(owner: LoyaltyOwner, points: number): Promise<void> {
    const qb = this.accountRepo
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `"points_balance" + ${points}`,
        lifetimePointsEarned: () => `"lifetime_points_earned" + ${points}`,
      });

    if (owner.userId) {
      qb.where('user_id = :userId', { userId: owner.userId });
    } else {
      qb.where('loyalty_customer_id = :loyaltyCustomerId', {
        loyaltyCustomerId: owner.loyaltyCustomerId,
      });
    }

    await qb.execute();
  }

  async listEntries(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ rows: LoyaltyLedgerEntry[]; total: number }> {
    const [rows, total] = await this.ledgerRepo.findAndCount({
      where: { userId },
      relations: ['order'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { rows, total };
  }

  async listCustomerAccounts(opts: {
    search?: string;
    limit: number;
    offset: number;
  }): Promise<{ rows: LoyaltyCustomerRow[]; total: number }> {
    const qb = this.accountRepo
      .createQueryBuilder('acc')
      .innerJoin('users', 'u', 'u.id = acc.user_id')
      .select('u.id', 'id')
      .addSelect('u.first_name', 'firstName')
      .addSelect('u.last_name', 'lastName')
      .addSelect('u.email', 'email')
      .addSelect('acc.points_balance', 'pointsBalance')
      .addSelect('acc.lifetime_points_earned', 'lifetimePointsEarned')
      .addSelect('acc.lifetime_points_redeemed', 'lifetimePointsRedeemed')
      .addSelect('acc.updated_at', 'lastActivityAt');

    if (opts.search?.trim()) {
      const term = `%${opts.search.trim().toLowerCase()}%`;
      qb.where(
        'LOWER(u.first_name) LIKE :term OR LOWER(u.last_name) LIKE :term OR LOWER(u.email) LIKE :term',
        { term },
      );
    }

    const totalQb = qb.clone();
    const total = await totalQb.getCount();

    const rawRows = await qb
      .orderBy('acc.points_balance', 'DESC')
      .addOrderBy('acc.updated_at', 'DESC')
      .limit(opts.limit)
      .offset(opts.offset)
      .getRawMany<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        pointsBalance: string | number;
        lifetimePointsEarned: string | number;
        lifetimePointsRedeemed: string | number;
        lastActivityAt: Date;
      }>();

    const rows: LoyaltyCustomerRow[] = rawRows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      pointsBalance: Number(r.pointsBalance),
      lifetimePointsEarned: Number(r.lifetimePointsEarned),
      lifetimePointsRedeemed: Number(r.lifetimePointsRedeemed),
      lastActivityAt: r.lastActivityAt,
    }));

    return { rows, total };
  }
}

export interface LoyaltyCustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  lastActivityAt: Date;
}
