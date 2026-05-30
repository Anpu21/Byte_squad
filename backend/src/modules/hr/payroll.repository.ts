import { Injectable } from '@nestjs/common';
import {
  DataSource,
  type DeepPartial,
  type EntityManager,
  type Repository,
} from 'typeorm';
import { Payroll } from '@/modules/hr/entities/payroll.entity';

export type PayrollStatus = 'Pending' | 'Approved' | 'Paid' | 'Cancelled';

export interface ListPayrollOptions {
  /**
   * When undefined the caller (admin) is allowed to span every branch.
   * The service layer is responsible for narrowing this for managers
   * before reaching the repo.
   */
  branchId?: string;
  employeeId?: string;
  month?: number;
  year?: number;
  /**
   * Single status or an array — the CSV export filters on
   * `['Approved', 'Paid']` in one query rather than running two.
   */
  status?: PayrollStatus | PayrollStatus[];
  limit: number;
  offset: number;
}

export interface ListPayrollResult {
  rows: Payroll[];
  total: number;
}

/**
 * Repository Pattern (rules §7) wrapper around the `Payroll` entity.
 *
 * Uses `DataSource.getRepository` rather than `@InjectRepository` so the
 * caller may participate in a surrounding transaction by passing an
 * `EntityManager` — the payroll generator wraps a single branch run in
 * one tx so a partial failure rolls back cleanly.
 *
 * Branch scoping joins through the `employees` table — the payroll row
 * itself does not denormalize `branch_id`. The composite unique on
 * (employee_id, pay_period_month, pay_period_year) from the BE-H1
 * migration is the real backstop against double-generation.
 */
@Injectable()
export class PayrollRepository {
  constructor(private readonly dataSource: DataSource) {}

  private repo(manager?: EntityManager): Repository<Payroll> {
    return manager
      ? manager.getRepository(Payroll)
      : this.dataSource.getRepository(Payroll);
  }

  findById(id: string, manager?: EntityManager): Promise<Payroll | null> {
    return this.repo(manager).findOne({ where: { id } });
  }

  /**
   * Lookup the canonical row for a single employee + pay period. Used
   * by the generator to detect (and refuse to overwrite) an existing
   * Approved/Paid run.
   */
  findExisting(
    employeeId: string,
    month: number,
    year: number,
    manager?: EntityManager,
  ): Promise<Payroll | null> {
    return this.repo(manager).findOne({
      where: {
        employeeId,
        payPeriodMonth: month,
        payPeriodYear: year,
      },
    });
  }

  /**
   * Branch-scoped + filtered list. Joins through `employees` so the
   * branch filter applies to the employee — payroll rows themselves
   * are not denormalized with `branch_id`. Orders by year/month DESC
   * then employee full name ASC so the most recent period surfaces
   * first in the HR UI.
   */
  async listForBranch(opts: ListPayrollOptions): Promise<ListPayrollResult> {
    const qb = this.repo()
      .createQueryBuilder('p')
      .innerJoin('employees', 'e', 'e.id = p.employee_id');
    if (opts.branchId) {
      qb.andWhere('e.branch_id = :bid', { bid: opts.branchId });
    }
    if (opts.employeeId) {
      qb.andWhere('p.employee_id = :eid', { eid: opts.employeeId });
    }
    if (opts.month !== undefined) {
      qb.andWhere('p.pay_period_month = :mo', { mo: opts.month });
    }
    if (opts.year !== undefined) {
      qb.andWhere('p.pay_period_year = :yr', { yr: opts.year });
    }
    if (opts.status) {
      if (Array.isArray(opts.status)) {
        qb.andWhere('p.payment_status IN (:...sts)', { sts: opts.status });
      } else {
        qb.andWhere('p.payment_status = :st', { st: opts.status });
      }
    }
    const total = await qb.clone().getCount();
    const rows = await qb
      .orderBy('p.pay_period_year', 'DESC')
      .addOrderBy('p.pay_period_month', 'DESC')
      .addOrderBy('e.full_name', 'ASC')
      .limit(opts.limit)
      .offset(opts.offset)
      .getMany();
    return { rows, total };
  }

  /**
   * Insert-or-overwrite for the generator. Always returns the freshly
   * persisted row. The service is responsible for refusing the call
   * when the existing row is in a non-Pending state — TypeORM 0.3's
   * `orUpdate` doesn't support a `WHERE` predicate on the conflict
   * update clause, so we model the upsert as find-then-save here and
   * let the service make the policy decision.
   */
  async upsert(
    input: DeepPartial<Payroll>,
    manager?: EntityManager,
  ): Promise<Payroll> {
    const r = this.repo(manager);
    return r.save(r.create(input));
  }

  async updatePartial(
    id: string,
    patch: DeepPartial<Payroll>,
    manager?: EntityManager,
  ): Promise<Payroll | null> {
    const r = this.repo(manager);
    await r.update({ id }, patch);
    return r.findOne({ where: { id } });
  }
}
