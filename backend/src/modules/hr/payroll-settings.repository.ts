import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DataSource,
  type DeepPartial,
  type EntityManager,
  IsNull,
  type Repository,
} from 'typeorm';
import { PayrollSettings } from '@/modules/hr/entities/payroll-settings.entity';

/**
 * Repository Pattern (rules §7) wrapper around the `PayrollSettings`
 * entity.
 *
 * The schema enforces:
 *   - at most one global row (`branch_id IS NULL`) via a partial
 *     unique index,
 *   - at most one row per branch via the matching partial unique on
 *     non-null `branch_id`.
 *
 * The migration seeds the global row at install time, so
 * `findEffective` should always find at least one match in a
 * well-formed database — a missing global row is treated as a
 * deployment-level invariant violation (500) rather than a 404.
 */
@Injectable()
export class PayrollSettingsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private repo(manager?: EntityManager): Repository<PayrollSettings> {
    return manager
      ? manager.getRepository(PayrollSettings)
      : this.dataSource.getRepository(PayrollSettings);
  }

  /**
   * The seeded global row. Resolved once at install via the BE-H1
   * migration; the service layer trusts this row exists.
   */
  findGlobal(): Promise<PayrollSettings | null> {
    return this.repo().findOne({ where: { branchId: IsNull() } });
  }

  findByBranch(branchId: string): Promise<PayrollSettings | null> {
    return this.repo().findOne({ where: { branchId } });
  }

  /**
   * Branch-first, global-fallback resolver. `branchId === null` skips
   * the branch lookup entirely and goes straight to the global row.
   *
   * Throws an internal-server error when neither exists — that would
   * mean the seed migration was rolled back without re-seeding, and
   * the caller would otherwise silently use uninitialised values.
   */
  async findEffective(branchId: string | null): Promise<PayrollSettings> {
    if (branchId) {
      const branchRow = await this.findByBranch(branchId);
      if (branchRow) return branchRow;
    }
    const globalRow = await this.findGlobal();
    if (!globalRow) {
      throw new InternalServerErrorException(
        'Global payroll settings row is missing — re-run HR migrations',
      );
    }
    return globalRow;
  }

  async save(input: DeepPartial<PayrollSettings>): Promise<PayrollSettings> {
    const r = this.repo();
    return r.save(r.create(input));
  }

  async updatePartial(
    id: string,
    patch: DeepPartial<PayrollSettings>,
  ): Promise<PayrollSettings | null> {
    const r = this.repo();
    await r.update({ id }, patch);
    return r.findOne({ where: { id } });
  }
}
