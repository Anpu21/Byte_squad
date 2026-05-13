import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';

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

  async createAccount(userId: string): Promise<LoyaltyAccount> {
    return this.accountRepo.save(this.accountRepo.create({ userId }));
  }

  async findLedgerEntry(
    userId: string,
    orderId: string,
    type: LoyaltyLedgerEntryType,
  ): Promise<LoyaltyLedgerEntry | null> {
    return this.ledgerRepo.findOne({ where: { userId, orderId, type } });
  }

  async createLedgerEntry(
    partial: DeepPartial<LoyaltyLedgerEntry>,
  ): Promise<LoyaltyLedgerEntry> {
    return this.ledgerRepo.save(this.ledgerRepo.create(partial));
  }

  async applyRedeem(userId: string, points: number): Promise<boolean> {
    const result = await this.accountRepo
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `"points_balance" - ${points}`,
        lifetimePointsRedeemed: () => `"lifetime_points_redeemed" + ${points}`,
      })
      .where('user_id = :userId', { userId })
      .andWhere('points_balance >= :points', { points })
      .execute();
    return Number(result.affected ?? 0) > 0;
  }

  async applyRedeemReversal(userId: string, points: number): Promise<void> {
    await this.accountRepo
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `"points_balance" + ${points}`,
        lifetimePointsRedeemed: () => `"lifetime_points_redeemed" - ${points}`,
      })
      .where('user_id = :userId', { userId })
      .execute();
  }

  async applyEarn(userId: string, points: number): Promise<void> {
    await this.accountRepo
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `"points_balance" + ${points}`,
        lifetimePointsEarned: () => `"lifetime_points_earned" + ${points}`,
      })
      .where('user_id = :userId', { userId })
      .execute();
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
}
