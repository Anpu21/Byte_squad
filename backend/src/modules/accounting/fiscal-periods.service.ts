import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FiscalPeriodLock } from '@accounting/entities/fiscal-period-lock.entity';

const CACHE_TTL_MS = 15_000;

/**
 * Month-level period locking. `assertOpen` runs inside the ledger
 * chokepoint for every posting, so it keeps a tiny TTL cache of the
 * locked set — a multi-line journal costs one query, not N. Locking or
 * unlocking busts the cache immediately.
 */
@Injectable()
export class FiscalPeriodsService {
  private lockedSet = new Set<string>();
  private cacheLoadedAt = 0;

  constructor(private readonly dataSource: DataSource) {}

  async list(year?: number): Promise<FiscalPeriodLock[]> {
    const repo = this.dataSource.getRepository(FiscalPeriodLock);
    return repo.find({
      where: year ? { year } : {},
      order: { year: 'DESC', month: 'ASC' },
    });
  }

  async lock(
    year: number,
    month: number,
    actorId: string,
  ): Promise<FiscalPeriodLock> {
    const repo = this.dataSource.getRepository(FiscalPeriodLock);
    const existing = await repo.findOne({ where: { year, month } });
    if (existing) {
      throw new ConflictException(
        `${this.label(year, month)} is already locked`,
      );
    }
    const saved = await repo.save(
      repo.create({ year, month, lockedByUserId: actorId }),
    );
    this.bustCache();
    return saved;
  }

  async unlock(year: number, month: number): Promise<void> {
    await this.dataSource
      .getRepository(FiscalPeriodLock)
      .delete({ year, month });
    this.bustCache();
  }

  /**
   * Reject postings whose business date lands in a locked month.
   * `entryDate` is an ISO `YYYY-MM-DD` string (the ledger entry_date).
   */
  async assertOpen(entryDate: string): Promise<void> {
    const year = Number(entryDate.slice(0, 4));
    const month = Number(entryDate.slice(5, 7));
    await this.refreshCacheIfStale();
    if (this.lockedSet.has(`${year}-${month}`)) {
      throw new ConflictException(
        `${this.label(year, month)} is locked — postings into a closed period are not allowed`,
      );
    }
  }

  private async refreshCacheIfStale(): Promise<void> {
    if (Date.now() - this.cacheLoadedAt < CACHE_TTL_MS) return;
    const rows = await this.dataSource.getRepository(FiscalPeriodLock).find();
    this.lockedSet = new Set(rows.map((r) => `${r.year}-${r.month}`));
    this.cacheLoadedAt = Date.now();
  }

  private bustCache(): void {
    this.cacheLoadedAt = 0;
  }

  private label(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}
