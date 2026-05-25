import { Injectable } from '@nestjs/common';
import {
  DataSource,
  type DeepPartial,
  type EntityManager,
  type Repository,
} from 'typeorm';
import { SalaryStructure } from '@/modules/hr/entities/salary-structure.entity';

/**
 * Repository Pattern (rules §7) wrapper around the `SalaryStructure`
 * entity. The payroll generator (BE-H6) leans on `findActiveOn` to
 * resolve the structure that applied on a specific work day — so this
 * repository carries the time-bounded read shapes the service layer
 * cannot express without dropping into raw query-builder code.
 *
 * The "at most one Active row per employee on a given date" invariant
 * is enforced at the service layer (atomic deactivate-then-insert
 * inside one transaction) rather than via a partial unique index on
 * overlapping ranges — PostgreSQL has no native exclusion constraint
 * primitive we can express through TypeORM 0.3 decorators reliably.
 */
@Injectable()
export class SalaryStructuresRepository {
  constructor(private readonly dataSource: DataSource) {}

  private repo(manager?: EntityManager): Repository<SalaryStructure> {
    return manager
      ? manager.getRepository(SalaryStructure)
      : this.dataSource.getRepository(SalaryStructure);
  }

  findById(id: string): Promise<SalaryStructure | null> {
    return this.repo().findOne({ where: { id } });
  }

  /**
   * Ordered DESC by `effectiveFromDate` so HR UIs render the newest
   * structure at the top of the timeline.
   */
  listForEmployee(employeeId: string): Promise<SalaryStructure[]> {
    return this.repo().find({
      where: { employeeId },
      order: { effectiveFromDate: 'DESC' },
    });
  }

  /**
   * The structure that was in effect for `employeeId` on `date`. Used
   * by the payroll generator to pick the right rate set per work day
   * (handles mid-month structure changes cleanly). Returns `null` when
   * nothing matches — the caller decides whether that's an error.
   */
  findActiveOn(
    employeeId: string,
    date: Date,
  ): Promise<SalaryStructure | null> {
    return this.repo()
      .createQueryBuilder('s')
      .where('s.employee_id = :eid', { eid: employeeId })
      .andWhere(`s.status = 'Active'`)
      .andWhere('s.effective_from_date <= :d', { d: date })
      .andWhere('(s.effective_to_date IS NULL OR s.effective_to_date >= :d)', {
        d: date,
      })
      .orderBy('s.effective_from_date', 'DESC')
      .limit(1)
      .getOne();
  }

  async save(
    input: DeepPartial<SalaryStructure>,
    manager?: EntityManager,
  ): Promise<SalaryStructure> {
    const r = this.repo(manager);
    return r.save(r.create(input));
  }

  async updatePartial(
    id: string,
    patch: DeepPartial<SalaryStructure>,
    manager?: EntityManager,
  ): Promise<SalaryStructure | null> {
    const r = this.repo(manager);
    await r.update({ id }, patch);
    return r.findOne({ where: { id } });
  }

  /**
   * Atomic close-out: stamp `effectiveToDate` and flip `status` to
   * `Inactive`. Called by the service when a new Active structure
   * starts so two overlapping Active rows can never exist for the
   * same employee.
   */
  async deactivate(
    id: string,
    effectiveToDate: Date,
    manager?: EntityManager,
  ): Promise<void> {
    await this.repo(manager).update(
      { id },
      { status: 'Inactive', effectiveToDate },
    );
  }
}
