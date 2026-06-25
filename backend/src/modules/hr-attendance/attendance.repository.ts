import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DataSource,
  type DeepPartial,
  type EntityManager,
  type Repository,
} from 'typeorm';
import { Attendance } from '@/modules/hr-attendance/entities/attendance.entity';

export interface ListAttendanceOptions {
  /**
   * When undefined, the caller (admin) is allowed to span every
   * branch. The service layer is responsible for narrowing this for
   * managers before reaching the repo.
   */
  branchId?: string;
  employeeId?: string;
  startDate: Date;
  endDate: Date;
}

export type ManagerAttendanceEntry = DeepPartial<Attendance> & {
  employeeId: string;
  attendanceDate: Date;
};

export interface CashierSelfCheckIn {
  employeeId: string;
  attendanceDate: Date;
  checkInTime: string;
  isLate: boolean;
  lateMinutes: number;
  createdBy: string;
}

export interface CashierSelfCheckOut {
  checkOutTime: string;
  totalHours: number;
  isOvertime: boolean;
  overtimeHours: number;
}

/**
 * Repository Pattern (rules §7) wrapper around the `Attendance`
 * entity.
 *
 * Uses `DataSource.getRepository` rather than `@InjectRepository` so
 * the caller may participate in a surrounding transaction by passing
 * an `EntityManager` — once the payroll-run flow lands in BE-H5 it
 * will need this hook to roll an attendance correction into the same
 * tx as the summary regeneration.
 *
 * The conflict target is `(employee_id, attendance_date)` — enforced
 * by the unique constraint `uq_attendance_employee_date` from the
 * BE-H1 migration. Manager bulk entries overwrite the row in full;
 * cashier self check-in / check-out flows touch only the fields they
 * own so a manager's manual override is not silently squashed.
 */
@Injectable()
export class AttendanceRepository {
  constructor(private readonly dataSource: DataSource) {}

  private repo(manager?: EntityManager): Repository<Attendance> {
    return manager
      ? manager.getRepository(Attendance)
      : this.dataSource.getRepository(Attendance);
  }

  findByEmployeeAndDate(
    employeeId: string,
    date: Date,
    manager?: EntityManager,
  ): Promise<Attendance | null> {
    return this.repo(manager).findOne({
      where: { employeeId, attendanceDate: date },
    });
  }

  /**
   * Branch-scoped + date-window list. Joins through the `employees`
   * table to filter by branch — the attendance row itself does not
   * denormalize `branchId` (see BE-H1 spec). Results are ordered by
   * date descending then by employee name ascending so the manager
   * grid renders newest-first within each day.
   */
  async listForBranch(opts: ListAttendanceOptions): Promise<Attendance[]> {
    const qb = this.repo()
      .createQueryBuilder('a')
      .innerJoin('employees', 'e', 'e.id = a.employee_id')
      .where('a.attendance_date BETWEEN :start AND :end', {
        start: opts.startDate,
        end: opts.endDate,
      });
    if (opts.branchId) {
      qb.andWhere('e.branch_id = :branchId', { branchId: opts.branchId });
    }
    if (opts.employeeId) {
      qb.andWhere('a.employee_id = :eid', { eid: opts.employeeId });
    }
    return qb
      .orderBy('a.attendance_date', 'DESC')
      .addOrderBy('e.full_name', 'ASC')
      .getMany();
  }

  /**
   * Manager-grade upsert. Inserts the row or — on conflict against
   * (employee_id, attendance_date) — overwrites every column the
   * manager grid is allowed to edit. The full set of overridable
   * columns is enumerated here rather than computed from the input
   * so a typo in a future caller can't accidentally clobber an
   * unrelated column.
   */
  async upsertManagerEntry(
    input: ManagerAttendanceEntry,
    manager?: EntityManager,
  ): Promise<Attendance> {
    const r = this.repo(manager);
    await r
      .createQueryBuilder()
      .insert()
      .into(Attendance)
      .values(input)
      .orUpdate(
        // `created_by` is intentionally omitted — the original creator
        // id must survive re-edits. The INSERT side still stamps
        // `created_by` for brand-new rows.
        [
          'check_in_time',
          'check_out_time',
          'total_hours',
          'status',
          'is_late',
          'late_minutes',
          'is_overtime',
          'overtime_hours',
          'marked_by',
          'cards_produced',
          'notes',
          'updated_at',
        ],
        ['employee_id', 'attendance_date'],
      )
      .execute();

    const found = await r.findOne({
      where: {
        employeeId: input.employeeId,
        attendanceDate: input.attendanceDate,
      },
    });
    if (!found) {
      // Should be unreachable — we just inserted/updated this row in
      // the same connection. Treat as a hard invariant violation
      // rather than tunneling a `null` back to the service.
      throw new InternalServerErrorException(
        'Attendance row vanished immediately after upsert',
      );
    }
    return found;
  }

  /**
   * Batch wrapper around `upsertManagerEntry`. Runs inside a single
   * transaction so a mid-batch failure doesn't leave the grid half
   * committed.
   */
  async upsertManagerEntries(
    rows: ManagerAttendanceEntry[],
  ): Promise<Attendance[]> {
    if (rows.length === 0) return [];
    return this.dataSource.transaction(async (manager) => {
      const out: Attendance[] = [];
      for (const row of rows) {
        out.push(await this.upsertManagerEntry(row, manager));
      }
      return out;
    });
  }

  /**
   * Cashier self check-in. Inserts a row if none exists for today,
   * or — on conflict — updates *only* the check-in-related fields.
   * Status and check-out are preserved if a manager had already
   * touched the row, so a manual override isn't silently overwritten.
   *
   * The caller is expected to have already validated that the day is
   * not Leave / Holiday and that no check-in is already recorded;
   * this method is the persistence layer, not the policy layer.
   */
  async upsertCheckIn(
    input: CashierSelfCheckIn,
    manager?: EntityManager,
  ): Promise<Attendance> {
    const r = this.repo(manager);
    await r
      .createQueryBuilder()
      .insert()
      .into(Attendance)
      .values({
        employeeId: input.employeeId,
        attendanceDate: input.attendanceDate,
        checkInTime: input.checkInTime,
        status: 'Present',
        isLate: input.isLate,
        lateMinutes: input.lateMinutes,
        markedBy: 'Cashier_Self',
        createdBy: input.createdBy,
      })
      .orUpdate(
        ['check_in_time', 'is_late', 'late_minutes', 'marked_by', 'updated_at'],
        ['employee_id', 'attendance_date'],
      )
      .execute();

    const found = await r.findOne({
      where: {
        employeeId: input.employeeId,
        attendanceDate: input.attendanceDate,
      },
    });
    if (!found) {
      throw new InternalServerErrorException(
        'Attendance row vanished immediately after check-in upsert',
      );
    }
    return found;
  }

  /**
   * Cashier self check-out. The row is guaranteed to exist (the
   * service refuses check-out unless a check-in is on file) so this
   * is a plain field update — no upsert dance required.
   */
  async applyCheckOut(
    employeeId: string,
    attendanceDate: Date,
    patch: CashierSelfCheckOut,
    manager?: EntityManager,
  ): Promise<Attendance> {
    const r = this.repo(manager);
    await r.update(
      { employeeId, attendanceDate },
      {
        checkOutTime: patch.checkOutTime,
        totalHours: patch.totalHours,
        isOvertime: patch.isOvertime,
        overtimeHours: patch.overtimeHours,
      },
    );
    const found = await r.findOne({
      where: { employeeId, attendanceDate },
    });
    if (!found) {
      throw new InternalServerErrorException(
        'Attendance row vanished immediately after check-out update',
      );
    }
    return found;
  }
}
