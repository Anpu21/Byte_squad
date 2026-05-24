import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import type { UpdateQueryBuilder } from 'typeorm';
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
   *
   * Owner WHERE is applied first so the balance guard can be added
   * via `.andWhere` — TypeORM's UpdateQueryBuilder.where() resets
   * the expression map, which would silently wipe the guard if the
   * order were reversed.
   */
  async applyRedeem(owner: LoyaltyOwner, points: number): Promise<boolean> {
    const qb = this.accountRepo
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `"points_balance" - ${points}`,
        lifetimePointsRedeemed: () => `"lifetime_points_redeemed" + ${points}`,
      });

    this.applyOwnerWhere(qb, owner);
    qb.andWhere('points_balance >= :points', { points });

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

    this.applyOwnerWhere(qb, owner);

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

    this.applyOwnerWhere(qb, owner);

    await qb.execute();
  }

  /**
   * Sets the owner WHERE on an UpdateQueryBuilder. Must be called
   * before any `.andWhere(...)` guards, because `.where()` resets
   * the expression map.
   */
  private applyOwnerWhere(
    qb: UpdateQueryBuilder<LoyaltyAccount>,
    owner: LoyaltyOwner,
  ): void {
    if (owner.userId) {
      qb.where('user_id = :userId', { userId: owner.userId });
    } else {
      qb.where('loyalty_customer_id = :loyaltyCustomerId', {
        loyaltyCustomerId: owner.loyaltyCustomerId,
      });
    }
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

  /**
   * Admin customer list, spanning BOTH user-side and walk-in-side
   * loyalty accounts. The query LEFT JOINs both identity tables and
   * COALESCEs the display fields so a row is always presentable
   * regardless of which owner column is set.
   *
   * For the "last activity branch" projection we join a correlated
   * subquery that picks the most-recent ledger entry per account
   * (by `MAX(created_at)` across both owner columns), then LEFT JOIN
   * `branches` so the name is null when the most recent activity was
   * an online earn (which has no branch).
   *
   * Filters:
   *   - branchId       — EXISTS a ledger row at that branch
   *   - activeSince    — EXISTS a ledger row on/after the date
   *   - branchId + activeSince — both conditions in the same EXISTS
   *   - minPoints / maxPoints — range on `acc.points_balance`
   *
   * The EXISTS subqueries lean on `idx_loyalty_ledger_branch_created_at`
   * (added in BE-L1) so the cost stays bounded as the ledger grows.
   */
  async listCustomerAccounts(opts: {
    search?: string;
    branchId?: string;
    activeSince?: string;
    minPoints?: number;
    maxPoints?: number;
    limit: number;
    offset: number;
  }): Promise<{ rows: LoyaltyCustomerRow[]; total: number }> {
    const qb = this.accountRepo
      .createQueryBuilder('acc')
      .leftJoin('users', 'u', 'u.id = acc.user_id')
      .leftJoin('loyalty_customers', 'lc', 'lc.id = acc.loyalty_customer_id')
      .leftJoin(
        (sub) =>
          sub
            .from(LoyaltyLedgerEntry, 'le')
            .select('le.user_id', 'user_id')
            .addSelect('le.loyalty_customer_id', 'loyalty_customer_id')
            .addSelect('le.branch_id', 'branch_id')
            .addSelect('le.created_at', 'created_at')
            .where(
              `le.created_at = (
                SELECT MAX(le2.created_at)
                FROM loyalty_ledger_entries le2
                WHERE (
                  (le2.user_id IS NOT NULL AND le2.user_id = le.user_id)
                  OR (le2.loyalty_customer_id IS NOT NULL
                      AND le2.loyalty_customer_id = le.loyalty_customer_id)
                )
              )`,
            ),
        'last_entry',
        `(
          (last_entry.user_id IS NOT NULL AND last_entry.user_id = acc.user_id)
          OR (last_entry.loyalty_customer_id IS NOT NULL
              AND last_entry.loyalty_customer_id = acc.loyalty_customer_id)
        )`,
      )
      .leftJoin('branches', 'br', 'br.id = last_entry.branch_id')
      .select('COALESCE(acc.user_id, acc.loyalty_customer_id)', 'id')
      .addSelect(
        `CASE WHEN acc.user_id IS NOT NULL THEN 'user' ELSE 'walkIn' END`,
        'ownerType',
      )
      .addSelect('acc.user_id', 'userId')
      .addSelect('acc.loyalty_customer_id', 'loyaltyCustomerId')
      .addSelect('COALESCE(u.first_name, lc.first_name)', 'firstName')
      .addSelect('COALESCE(u.last_name, lc.last_name)', 'lastName')
      .addSelect('u.email', 'email')
      .addSelect('COALESCE(u.phone, lc.phone)', 'phone')
      .addSelect('acc.points_balance', 'pointsBalance')
      .addSelect('acc.lifetime_points_earned', 'lifetimePointsEarned')
      .addSelect('acc.lifetime_points_redeemed', 'lifetimePointsRedeemed')
      .addSelect(
        'COALESCE(last_entry.created_at, acc.updated_at)',
        'lastActivityAt',
      )
      .addSelect('last_entry.branch_id', 'lastActivityBranchId')
      .addSelect('br.name', 'lastActivityBranchName');

    if (opts.search?.trim()) {
      const term = `%${opts.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `(
          LOWER(COALESCE(u.first_name, lc.first_name)) LIKE :term
          OR LOWER(COALESCE(u.last_name, lc.last_name)) LIKE :term
          OR LOWER(u.email) LIKE :term
          OR COALESCE(u.phone, lc.phone) LIKE :term
        )`,
        { term },
      );
    }

    if (opts.minPoints !== undefined) {
      qb.andWhere('acc.points_balance >= :minPoints', {
        minPoints: opts.minPoints,
      });
    }
    if (opts.maxPoints !== undefined) {
      qb.andWhere('acc.points_balance <= :maxPoints', {
        maxPoints: opts.maxPoints,
      });
    }

    if (opts.branchId || opts.activeSince) {
      const params: Record<string, unknown> = {};
      const conditions: string[] = [];
      if (opts.branchId) {
        conditions.push('le3.branch_id = :branchId');
        params.branchId = opts.branchId;
      }
      if (opts.activeSince) {
        conditions.push('le3.created_at >= :activeSince');
        params.activeSince = opts.activeSince;
      }
      const ledgerWhere = conditions.length
        ? ` AND ${conditions.join(' AND ')}`
        : '';
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM loyalty_ledger_entries le3
          WHERE (
            (le3.user_id IS NOT NULL AND le3.user_id = acc.user_id)
            OR (le3.loyalty_customer_id IS NOT NULL
                AND le3.loyalty_customer_id = acc.loyalty_customer_id)
          )${ledgerWhere}
        )`,
        params,
      );
    }

    const totalQb = qb.clone();
    const total = await totalQb.getCount();

    const rawRows = await qb
      .orderBy('acc.points_balance', 'DESC')
      .addOrderBy('acc.updated_at', 'DESC')
      .limit(opts.limit)
      .offset(opts.offset)
      .getRawMany<LoyaltyCustomerRawRow>();

    const rows: LoyaltyCustomerRow[] = rawRows.map((r) => ({
      id: r.id,
      ownerType: r.ownerType,
      userId: r.userId ?? null,
      loyaltyCustomerId: r.loyaltyCustomerId ?? null,
      firstName: r.firstName,
      lastName: r.lastName ?? null,
      email: r.email ?? null,
      phone: r.phone ?? null,
      pointsBalance: Number(r.pointsBalance),
      lifetimePointsEarned: Number(r.lifetimePointsEarned),
      lifetimePointsRedeemed: Number(r.lifetimePointsRedeemed),
      lastActivityAt: r.lastActivityAt ?? null,
      lastActivityBranchId: r.lastActivityBranchId ?? null,
      lastActivityBranchName: r.lastActivityBranchName ?? null,
    }));

    return { rows, total };
  }
}

interface LoyaltyCustomerRawRow {
  id: string;
  ownerType: 'user' | 'walkIn';
  userId: string | null;
  loyaltyCustomerId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  pointsBalance: string | number;
  lifetimePointsEarned: string | number;
  lifetimePointsRedeemed: string | number;
  lastActivityAt: Date | null;
  lastActivityBranchId: string | null;
  lastActivityBranchName: string | null;
}

export interface LoyaltyCustomerRow {
  /**
   * Polymorphic identity: `userId` for online customers,
   * `loyaltyCustomerId` for walk-ins. Always set, unique per wallet,
   * used as the table key and as the route-param for the history
   * modal (walk-in history routing lands in a later phase).
   */
  id: string;
  /** Discriminates which polymorphic owner column is set on the wallet. */
  ownerType: 'user' | 'walkIn';
  /** Set when `ownerType === 'user'`; null for walk-ins. */
  userId: string | null;
  /** Set when `ownerType === 'walkIn'`; null for online users. */
  loyaltyCustomerId: string | null;
  firstName: string;
  /** Walk-ins may not have a last name. */
  lastName: string | null;
  /** Walk-ins have no email. */
  email: string | null;
  /** Users may not have a phone. */
  phone: string | null;
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  /** Falls back to `acc.updated_at` when the ledger is empty. */
  lastActivityAt: Date | null;
  /** Branch id of the most-recent ledger entry; null for online-only activity. */
  lastActivityBranchId: string | null;
  /** Branch name for `lastActivityBranchId`; null when the branch is null. */
  lastActivityBranchName: string | null;
}
