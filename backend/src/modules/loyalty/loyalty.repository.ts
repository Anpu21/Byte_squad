import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import type { UpdateQueryBuilder } from 'typeorm';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyCustomer } from '@/modules/loyalty/entities/loyalty-customer.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { Sale } from '@pos/entities/sale.entity';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';
import {
  applyLedgerActivityExists,
  normalizeCustomerRow,
} from '@/modules/loyalty/loyalty-customer-accounts.helpers';
import type {
  LoyaltyCustomerAccountsQueryOptions,
  LoyaltyCustomerRawRow,
  LoyaltyCustomerRow,
  LoyaltyOwner,
} from '@/modules/loyalty/types';

interface LoyaltyDashboardAccountStatsRaw {
  totalMembers: string | null;
  totalPointsInCirculation: string | null;
}

interface LoyaltyDashboardEarnedStatsRaw {
  pointsEarned: string | null;
}

interface LoyaltyDashboardRedeemedStatsRaw {
  pointsRedeemed: string | null;
}

@Injectable()
export class LoyaltyRepository {
  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly accountRepo: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyCustomer)
    private readonly customerRepo: Repository<LoyaltyCustomer>,
    @InjectRepository(LoyaltyLedgerEntry)
    private readonly ledgerRepo: Repository<LoyaltyLedgerEntry>,
    private readonly dataSource: DataSource,
  ) {}

  async findAccountByUser(
    userId: string,
    manager?: EntityManager,
  ): Promise<LoyaltyAccount | null> {
    return this.accounts(manager).findOne({ where: { userId } });
  }

  async findAccountByLoyaltyCustomer(
    loyaltyCustomerId: string,
    manager?: EntityManager,
  ): Promise<LoyaltyAccount | null> {
    return this.accounts(manager).findOne({ where: { loyaltyCustomerId } });
  }

  async createAccountForUser(
    userId: string,
    manager?: EntityManager,
  ): Promise<LoyaltyAccount> {
    const repo = this.accounts(manager);
    return repo.save(repo.create({ userId }));
  }

  async createAccountForLoyaltyCustomer(
    loyaltyCustomerId: string,
    manager?: EntityManager,
  ): Promise<LoyaltyAccount> {
    const repo = this.accounts(manager);
    return repo.save(repo.create({ loyaltyCustomerId }));
  }

  async findLedgerEntry(
    owner: LoyaltyOwner,
    orderId: string,
    type: LoyaltyLedgerEntryType,
    manager?: EntityManager,
  ): Promise<LoyaltyLedgerEntry | null> {
    const repo = this.ledger(manager);
    if (owner.userId) {
      return repo.findOne({
        where: { userId: owner.userId, orderId, type },
      });
    }
    return repo.findOne({
      where: {
        loyaltyCustomerId: owner.loyaltyCustomerId,
        orderId,
        type,
      },
    });
  }

  async createLedgerEntry(
    partial: DeepPartial<LoyaltyLedgerEntry>,
    manager?: EntityManager,
  ): Promise<LoyaltyLedgerEntry> {
    const repo = this.ledger(manager);
    return repo.save(repo.create(partial));
  }

  async findLedgerEntriesByOrder(
    orderId: string,
    types: LoyaltyLedgerEntryType[],
    manager?: EntityManager,
  ): Promise<LoyaltyLedgerEntry[]> {
    if (types.length === 0) return [];
    return this.ledger(manager)
      .createQueryBuilder('entry')
      .where('entry.order_id = :orderId', { orderId })
      .andWhere('entry.type IN (:...types)', { types })
      .getMany();
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
  async applyRedeem(
    owner: LoyaltyOwner,
    points: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const qb = this.accounts(manager)
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
    manager?: EntityManager,
  ): Promise<void> {
    const qb = this.accounts(manager)
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `"points_balance" + ${points}`,
        lifetimePointsRedeemed: () => `"lifetime_points_redeemed" - ${points}`,
      });

    this.applyOwnerWhere(qb, owner);

    await qb.execute();
  }

  async applyEarn(
    owner: LoyaltyOwner,
    points: number,
    manager?: EntityManager,
  ): Promise<void> {
    const qb = this.accounts(manager)
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `"points_balance" + ${points}`,
        lifetimePointsEarned: () => `"lifetime_points_earned" + ${points}`,
      });

    this.applyOwnerWhere(qb, owner);

    await qb.execute();
  }

  async applyEarnReversal(
    owner: LoyaltyOwner,
    points: number,
    manager?: EntityManager,
  ): Promise<void> {
    const qb = this.accounts(manager)
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `GREATEST(0, "points_balance" - ${points})`,
        lifetimePointsEarned: () =>
          `GREATEST(0, "lifetime_points_earned" - ${points})`,
      });

    this.applyOwnerWhere(qb, owner);

    await qb.execute();
  }

  async applyManualAdjustment(
    owner: LoyaltyOwner,
    points: number,
    manager?: EntityManager,
  ): Promise<void> {
    const qb = this.accounts(manager)
      .createQueryBuilder()
      .update(LoyaltyAccount)
      .set({
        pointsBalance: () => `GREATEST(0, "points_balance" + ${points})`,
      });

    this.applyOwnerWhere(qb, owner);

    await qb.execute();
  }

  async mergeWalkInIntoUser(params: {
    userId: string;
    loyaltyCustomerId: string;
  }): Promise<LoyaltyAccount> {
    return this.dataSource.transaction(async (manager) => {
      const accounts = this.accounts(manager);
      const customers = this.customers(manager);
      const ledger = this.ledger(manager);

      const walkIn = await customers.findOne({
        where: { id: params.loyaltyCustomerId },
      });
      if (!walkIn) {
        const existing = await this.findAccountByUser(params.userId, manager);
        return existing ?? this.createAccountForUser(params.userId, manager);
      }

      const walkInAccount = await accounts
        .createQueryBuilder('acc')
        .setLock('pessimistic_write')
        .where('acc.loyalty_customer_id = :loyaltyCustomerId', {
          loyaltyCustomerId: params.loyaltyCustomerId,
        })
        .getOne();

      let userAccount = await accounts
        .createQueryBuilder('acc')
        .setLock('pessimistic_write')
        .where('acc.user_id = :userId', { userId: params.userId })
        .getOne();

      const movedBalance = Number(walkInAccount?.pointsBalance ?? 0);
      const movedEarned = Number(walkInAccount?.lifetimePointsEarned ?? 0);
      const movedRedeemed = Number(walkInAccount?.lifetimePointsRedeemed ?? 0);

      if (!userAccount && walkInAccount) {
        await accounts.update(walkInAccount.id, {
          userId: params.userId,
          loyaltyCustomerId: null,
        });
      } else if (userAccount && walkInAccount) {
        await accounts
          .createQueryBuilder()
          .update(LoyaltyAccount)
          .set({
            pointsBalance: () => `"points_balance" + ${movedBalance}`,
            lifetimePointsEarned: () =>
              `"lifetime_points_earned" + ${movedEarned}`,
            lifetimePointsRedeemed: () =>
              `"lifetime_points_redeemed" + ${movedRedeemed}`,
          })
          .where('id = :id', { id: userAccount.id })
          .execute();
        await accounts.delete(walkInAccount.id);
      } else if (!userAccount) {
        userAccount = await this.createAccountForUser(params.userId, manager);
      }

      await ledger.update(
        { loyaltyCustomerId: params.loyaltyCustomerId },
        { userId: params.userId, loyaltyCustomerId: null },
      );

      await manager
        .getRepository(Sale)
        .createQueryBuilder()
        .update(Sale)
        .set({
          customerUserId: params.userId,
          loyaltyCustomerId: null,
        })
        .where('loyalty_customer_id = :loyaltyCustomerId', {
          loyaltyCustomerId: params.loyaltyCustomerId,
        })
        .andWhere('customer_user_id IS NULL')
        .execute();

      await this.createLedgerEntry(
        {
          userId: params.userId,
          loyaltyCustomerId: null,
          branchId: null,
          orderId: null,
          type: LoyaltyLedgerEntryType.MERGE_TRANSFER,
          points: 0,
          description: `Merged physical loyalty wallet ${walkIn.phone} into online account`,
          metadata: {
            loyaltyCustomerId: params.loyaltyCustomerId,
            phone: walkIn.phone,
            transferredPointsBalance: movedBalance,
            transferredLifetimePointsEarned: movedEarned,
            transferredLifetimePointsRedeemed: movedRedeemed,
          },
        },
        manager,
      );

      await customers.delete(params.loyaltyCustomerId);

      const merged = await this.findAccountByUser(params.userId, manager);
      if (merged) return merged;
      return this.createAccountForUser(params.userId, manager);
    });
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

  private accounts(manager?: EntityManager): Repository<LoyaltyAccount> {
    return manager?.getRepository(LoyaltyAccount) ?? this.accountRepo;
  }

  private customers(manager?: EntityManager): Repository<LoyaltyCustomer> {
    return manager?.getRepository(LoyaltyCustomer) ?? this.customerRepo;
  }

  private ledger(manager?: EntityManager): Repository<LoyaltyLedgerEntry> {
    return manager?.getRepository(LoyaltyLedgerEntry) ?? this.ledgerRepo;
  }

  async listEntries(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ rows: LoyaltyLedgerEntry[]; total: number }> {
    const [rows, total] = await this.ledgerRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { rows, total };
  }

  /**
   * History for either owner side (walk-ins have no `userId`, so the
   * customer /me path's `listEntries(userId)` can't serve them).
   * Returns empty when neither owner id is set.
   */
  async listEntriesByOwner(
    owner: { userId: string | null; loyaltyCustomerId: string | null },
    limit: number,
    offset: number,
  ): Promise<{ rows: LoyaltyLedgerEntry[]; total: number }> {
    const where = owner.userId
      ? { userId: owner.userId }
      : owner.loyaltyCustomerId
        ? { loyaltyCustomerId: owner.loyaltyCustomerId }
        : null;
    if (!where) return { rows: [], total: 0 };
    const [rows, total] = await this.ledgerRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { rows, total };
  }

  /** True when the owner has ≥1 ledger movement at the given branch. */
  async hasLedgerAtBranch(
    owner: { userId: string | null; loyaltyCustomerId: string | null },
    branchId: string,
  ): Promise<boolean> {
    const qb = this.ledgerRepo
      .createQueryBuilder('le')
      .where('le.branch_id = :branchId', { branchId });
    if (owner.userId) {
      qb.andWhere('le.user_id = :userId', { userId: owner.userId });
    } else if (owner.loyaltyCustomerId) {
      qb.andWhere('le.loyalty_customer_id = :cid', {
        cid: owner.loyaltyCustomerId,
      });
    } else {
      return false;
    }
    return (await qb.getCount()) > 0;
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
   * Filter semantics live on `LoyaltyCustomerAccountsQueryOptions`.
   * The EXISTS subqueries lean on `idx_loyalty_ledger_branch_created_at`
   * (added in BE-L1) so the cost stays bounded as the ledger grows.
   */
  async listCustomerAccounts(
    opts: LoyaltyCustomerAccountsQueryOptions,
  ): Promise<{ rows: LoyaltyCustomerRow[]; total: number }> {
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
      applyLedgerActivityExists(qb, opts);
    }

    const totalQb = qb.clone();
    const total = await totalQb.getCount();

    const rawRows = await qb
      .orderBy('acc.points_balance', 'DESC')
      .addOrderBy('acc.updated_at', 'DESC')
      .limit(opts.limit)
      .offset(opts.offset)
      .getRawMany<LoyaltyCustomerRawRow>();

    return { rows: rawRows.map(normalizeCustomerRow), total };
  }

  async getDashboardStats(branchId?: string): Promise<{
    totalMembers: number;
    totalPointsInCirculation: number;
    pointsEarnedThisMonth: number;
    pointsRedeemedThisMonth: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const branchFilter = branchId
      ? `EXISTS (SELECT 1 FROM loyalty_ledger_entries le WHERE (le.user_id = acc.user_id OR le.loyalty_customer_id = acc.loyalty_customer_id) AND le.branch_id = :branchId)`
      : '1=1';

    const accountStats = await this.accountRepo
      .createQueryBuilder('acc')
      .select('COUNT(acc.id)', 'totalMembers')
      .addSelect('SUM(acc.points_balance)', 'totalPointsInCirculation')
      .where(branchFilter, { branchId })
      .getRawOne<LoyaltyDashboardAccountStatsRaw>();

    const ledgerFilter = branchId ? `le.branch_id = :branchId` : '1=1';

    const earnedStats = await this.ledgerRepo
      .createQueryBuilder('le')
      .select('SUM(le.points)', 'pointsEarned')
      .where('le.type = :type', { type: LoyaltyLedgerEntryType.EARNED })
      .andWhere('le.created_at >= :startOfMonth', { startOfMonth })
      .andWhere(ledgerFilter, { branchId })
      .getRawOne<LoyaltyDashboardEarnedStatsRaw>();

    const redeemedStats = await this.ledgerRepo
      .createQueryBuilder('le')
      .select('SUM(le.points)', 'pointsRedeemed')
      .where('le.type = :type', { type: LoyaltyLedgerEntryType.REDEEMED })
      .andWhere('le.created_at >= :startOfMonth', { startOfMonth })
      .andWhere(ledgerFilter, { branchId })
      .getRawOne<LoyaltyDashboardRedeemedStatsRaw>();

    return {
      totalMembers: Number(accountStats?.totalMembers ?? 0),
      totalPointsInCirculation: Number(
        accountStats?.totalPointsInCirculation ?? 0,
      ),
      pointsEarnedThisMonth: Number(earnedStats?.pointsEarned ?? 0),
      pointsRedeemedThisMonth: Number(redeemedStats?.pointsRedeemed ?? 0),
    };
  }
}
