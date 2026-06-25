import { Injectable } from '@nestjs/common';
import {
  DataSource,
  type DeepPartial,
  type EntityManager,
  type Repository,
} from 'typeorm';
import { EmployeeLeave } from '@/modules/hr-leaves/entities/employee-leave.entity';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface ListEmployeeLeavesOptions {
  /** When undefined the caller (admin) is allowed to span every branch. */
  branchId?: string;
  employeeId?: string;
  status?: LeaveStatus;
  /** Inclusive overlap window. If both are set, only leaves whose
   * date-range overlaps `[startDate, endDate]` are returned. */
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
}

export interface ListEmployeeLeavesResult {
  rows: EmployeeLeave[];
  total: number;
}

/**
 * Repository Pattern (rules §7) wrapper around the `EmployeeLeave`
 * entity. Branch scoping happens via an INNER JOIN against `employees`
 * — leaves don't carry their own `branch_id` since an employee can
 * never belong to more than one branch at a time.
 */
@Injectable()
export class EmployeeLeavesRepository {
  constructor(private readonly dataSource: DataSource) {}

  private repo(manager?: EntityManager): Repository<EmployeeLeave> {
    return manager
      ? manager.getRepository(EmployeeLeave)
      : this.dataSource.getRepository(EmployeeLeave);
  }

  findById(id: string): Promise<EmployeeLeave | null> {
    return this.repo().findOne({ where: { id } });
  }

  async listForBranch(
    opts: ListEmployeeLeavesOptions,
  ): Promise<ListEmployeeLeavesResult> {
    const qb = this.repo()
      .createQueryBuilder('l')
      .innerJoin('employees', 'e', 'e.id = l.employee_id');
    if (opts.branchId) {
      qb.andWhere('e.branch_id = :bid', { bid: opts.branchId });
    }
    if (opts.employeeId) {
      qb.andWhere('l.employee_id = :eid', { eid: opts.employeeId });
    }
    if (opts.status) {
      qb.andWhere('l.status = :st', { st: opts.status });
    }
    if (opts.startDate && opts.endDate) {
      // Date-range overlap: keep leaves where the start is on/before
      // window-end AND the end is on/after window-start. The double
      // negation in the inverse form is also correct but harder to
      // read; the explicit overlap predicate is the clear form.
      qb.andWhere('l.start_date <= :we', { we: opts.endDate });
      qb.andWhere('l.end_date >= :ws', { ws: opts.startDate });
    }
    const total = await qb.clone().getCount();
    const rows = await qb
      .orderBy('l.applied_date', 'DESC')
      .addOrderBy('l.created_at', 'DESC')
      .limit(opts.limit)
      .offset(opts.offset)
      .getMany();
    return { rows, total };
  }

  /**
   * Returns leaves that conflict with `[startDate, endDate]` for the
   * same employee and are still live (Pending or Approved). Used by
   * `apply` to prevent double-booking the same days.
   */
  async findOverlapping(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeLeaveId?: string,
  ): Promise<EmployeeLeave[]> {
    const qb = this.repo()
      .createQueryBuilder('l')
      .where('l.employee_id = :eid', { eid: employeeId })
      .andWhere('l.status IN (:...statuses)', {
        statuses: ['Pending', 'Approved'],
      })
      .andWhere('l.start_date <= :we', { we: endDate })
      .andWhere('l.end_date >= :ws', { ws: startDate });
    if (excludeLeaveId) {
      qb.andWhere('l.id != :ex', { ex: excludeLeaveId });
    }
    return qb.getMany();
  }

  async save(
    input: DeepPartial<EmployeeLeave>,
    manager?: EntityManager,
  ): Promise<EmployeeLeave> {
    const r = this.repo(manager);
    return r.save(r.create(input));
  }

  async updatePartial(
    id: string,
    patch: DeepPartial<EmployeeLeave>,
    manager?: EntityManager,
  ): Promise<EmployeeLeave | null> {
    const r = this.repo(manager);
    await r.update({ id }, patch);
    return r.findOne({ where: { id } });
  }
}
