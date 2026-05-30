import { Injectable } from '@nestjs/common';
import {
  DataSource,
  type DeepPartial,
  type EntityManager,
  type Repository,
} from 'typeorm';
import { Employee } from '@/modules/hr/entities/employee.entity';

export type EmployeeStatus = 'Active' | 'Resigned' | 'Terminated' | 'OnLeave';

export interface ListEmployeesOptions {
  /** When undefined the caller (admin) is allowed to span every branch. */
  branchId?: string;
  search?: string;
  status?: EmployeeStatus;
  limit: number;
  offset: number;
}

export interface ListEmployeesResult {
  rows: Employee[];
  total: number;
}

/**
 * Repository Pattern (rules §7) wrapper around the `Employee` entity.
 *
 * Uses `DataSource.getRepository` rather than `@InjectRepository` so the
 * caller may participate in a surrounding transaction by passing an
 * `EntityManager`. The HR module surface (services, controllers) goes
 * through this layer — direct entity-manager access from services is a
 * code-review reject.
 */
@Injectable()
export class EmployeesRepository {
  constructor(private readonly dataSource: DataSource) {}

  private repo(manager?: EntityManager): Repository<Employee> {
    return manager
      ? manager.getRepository(Employee)
      : this.dataSource.getRepository(Employee);
  }

  findById(id: string): Promise<Employee | null> {
    return this.repo().findOne({ where: { id } });
  }

  findByEmployeeCode(code: string): Promise<Employee | null> {
    return this.repo().findOne({ where: { employeeCode: code } });
  }

  findByNic(nic: string): Promise<Employee | null> {
    return this.repo().findOne({ where: { nic } });
  }

  /**
   * Resolves the employee record that owns a given user account.
   * Used by the cashier self check-in flow so the service layer can
   * stay inside the repository pattern (rules §7) instead of reaching
   * into TypeORM directly.
   */
  findByUserId(userId: string): Promise<Employee | null> {
    return this.repo().findOne({ where: { userId } });
  }

  /**
   * Branch-scoped + filtered list. `branchId === undefined` widens the
   * query to every branch (admin path); the service layer is the gate
   * that decides whether the caller is allowed to do that. Search is a
   * case-insensitive substring match against `fullName`, `employeeCode`,
   * and `nic` — the three fields HR users rely on at the counter.
   */
  async listForBranch(
    opts: ListEmployeesOptions,
  ): Promise<ListEmployeesResult> {
    const qb = this.repo().createQueryBuilder('e');
    if (opts.branchId) {
      qb.andWhere('e.branchId = :branchId', { branchId: opts.branchId });
    }
    if (opts.status) {
      qb.andWhere('e.status = :status', { status: opts.status });
    }
    const term = opts.search?.trim().toLowerCase();
    if (term && term.length > 0) {
      const pattern = `%${term}%`;
      qb.andWhere(
        "(LOWER(e.fullName) LIKE :pattern OR LOWER(e.employeeCode) LIKE :pattern OR LOWER(COALESCE(e.nic, '')) LIKE :pattern)",
        { pattern },
      );
    }
    const total = await qb.clone().getCount();
    const rows = await qb
      .orderBy('e.createdAt', 'DESC')
      .limit(opts.limit)
      .offset(opts.offset)
      .getMany();
    return { rows, total };
  }

  async save(
    input: DeepPartial<Employee>,
    manager?: EntityManager,
  ): Promise<Employee> {
    const r = this.repo(manager);
    return r.save(r.create(input));
  }

  async updatePartial(
    id: string,
    patch: DeepPartial<Employee>,
    manager?: EntityManager,
  ): Promise<Employee | null> {
    const r = this.repo(manager);
    await r.update({ id }, patch);
    return r.findOne({ where: { id } });
  }

  async setPhotoUrl(id: string, url: string | null): Promise<void> {
    await this.repo().update({ id }, { photoUrl: url });
  }

  /**
   * Soft termination — flips status, stamps the reason + date. We do
   * NOT delete the row; the HR module needs to keep terminated
   * employees in payroll history.
   */
  async softTerminate(id: string, reason: string, date: Date): Promise<void> {
    await this.repo().update(
      { id },
      {
        status: 'Terminated',
        terminationDate: date,
        terminationReason: reason,
      },
    );
  }

  /**
   * Adjusts an employee's running annual-leave balance by a signed
   * delta inside the caller's transaction. Used by the leaves
   * approve/cancel flow so a race between two managers approving
   * overlapping requests can't drive the wallet negative — the SQL
   * `+ :delta` is atomic at the row level.
   *
   * Pass `-totalDays` on approval, `+totalDays` to revert on cancel.
   */
  async adjustAnnualLeaveBalance(
    employeeId: string,
    delta: number,
    manager?: EntityManager,
  ): Promise<void> {
    await this.repo(manager)
      .createQueryBuilder()
      .update(Employee)
      .set({
        annualLeaveBalance: () => `"annual_leave_balance" + ${delta}`,
      })
      .where('id = :id', { id: employeeId })
      .execute();
  }
}
