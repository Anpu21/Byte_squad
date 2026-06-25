import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Account } from '@/modules/accounting-core/entities/account.entity';
import {
  SYSTEM_ACCOUNTS,
  type AccountCode,
} from '@/modules/accounting-core/types/account-code.type';

/**
 * Chart-of-accounts repository (Rules.md §7). Keeps a code→id cache so
 * the hot posting path never pays a lookup query per entry; the cache
 * loads lazily and refreshes on a miss.
 */
@Injectable()
export class AccountsRepository {
  private readonly accounts: Repository<Account>;
  private idByCodeCache = new Map<string, string>();

  constructor(private readonly dataSource: DataSource) {
    this.accounts = dataSource.getRepository(Account);
  }

  async list(): Promise<Account[]> {
    return this.accounts.find({ order: { code: 'ASC' } });
  }

  /** Idempotent system-account seeding (dev boot + tests). */
  async ensureSeeded(): Promise<void> {
    for (const seed of SYSTEM_ACCOUNTS) {
      await this.accounts
        .createQueryBuilder()
        .insert()
        .into(Account)
        .values({ ...seed, isSystem: true })
        .orIgnore()
        .execute();
    }
    this.idByCodeCache = new Map();
  }

  async idByCode(
    code: AccountCode,
    manager?: EntityManager,
  ): Promise<string | null> {
    const cached = this.idByCodeCache.get(code);
    if (cached) return cached;

    const repo = manager ? manager.getRepository(Account) : this.accounts;
    const rows = await repo.find();
    this.idByCodeCache = new Map(rows.map((a) => [a.code, a.id]));
    return this.idByCodeCache.get(code) ?? null;
  }
}
