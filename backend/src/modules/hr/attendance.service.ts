import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { AttendanceRepository } from '@/modules/hr/attendance.repository';
import { EmployeesRepository } from '@/modules/hr/employees.repository';
import { PayrollSettingsService } from '@/modules/hr/payroll-settings.service';
import { Attendance } from '@/modules/hr/entities/attendance.entity';
import { Employee } from '@/modules/hr/entities/employee.entity';
import { ListAttendanceQueryDto } from '@/modules/hr/dto/list-attendance-query.dto';
import {
  BulkAttendanceDto,
  type BulkAttendanceRowDto,
} from '@/modules/hr/dto/bulk-attendance.dto';
import {
  computeLate,
  computeOvertime,
  computeTotalHours,
  formatClock,
  todayDate,
} from '@/modules/hr/attendance-math';

export interface AttendanceActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

export interface AttendanceListResponse {
  rows: Attendance[];
  total: number;
}

/**
 * Safety net for the late-grace lookup. Matches the
 * `payroll_settings.late_grace_minutes` seed in the BE-H1 migration so
 * if `PayrollSettingsService.getEffective` blows up (e.g. the global
 * row was hand-deleted in a broken environment) we still mark
 * lateness consistently with the schema default instead of throwing
 * mid-check-in.
 */
const FALLBACK_GRACE_MINUTES = 15;

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendance: AttendanceRepository,
    private readonly employees: EmployeesRepository,
    private readonly payrollSettings: PayrollSettingsService,
  ) {}

  /**
   * Branch-scoped list. Managers are pinned to their own branch
   * regardless of the `branchId` query param — the URL cannot widen
   * scope. Admins may pass `branchId` to filter, or omit it to span
   * every branch.
   */
  async list(
    query: ListAttendanceQueryDto,
    actor: AttendanceActor,
  ): Promise<AttendanceListResponse> {
    const branchId =
      actor.role === UserRole.ADMIN
        ? query.branchId
        : (actor.branchId ?? undefined);

    const rows = await this.attendance.listForBranch({
      branchId,
      employeeId: query.employeeId,
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    });
    return { rows, total: rows.length };
  }

  /**
   * Manager bulk grid submission. For each row:
   *   - Verifies the employee is visible to the actor (admin = all,
   *     manager = own branch).
   *   - Computes `isLate` / `lateMinutes` against the employee's
   *     scheduled start + the global grace window.
   *   - Computes `totalHours` from check-in/out when both are
   *     present.
   *   - Stamps `markedBy` from the actor role (`Admin` vs
   *     `Manual`).
   * Persists the batch inside a single transaction.
   */
  async bulkUpsert(
    dto: BulkAttendanceDto,
    actor: AttendanceActor,
  ): Promise<Attendance[]> {
    // Cache employees so a 500-row grid doesn't fan out into 500
    // identical lookups for the same code.
    const employeeCache = new Map<string, Employee>();
    const markedBy: Attendance['markedBy'] =
      actor.role === UserRole.ADMIN ? 'Admin' : 'Manual';

    const prepared = [] as Array<
      Parameters<AttendanceRepository['upsertManagerEntry']>[0]
    >;
    // Cache the grace window per branch — a 500-row grid that spans
    // two branches still resolves payroll settings exactly twice.
    const graceCache = new Map<string, number>();

    for (const row of dto.rows) {
      const employee = await this.resolveEmployee(
        row.employeeId,
        actor,
        employeeCache,
      );

      const grace = await this.resolveGraceMinutes(
        employee.branchId,
        graceCache,
      );
      const { isLate, lateMinutes } = row.checkInTime
        ? computeLate(row.checkInTime, employee.workingHoursStart, grace)
        : { isLate: false, lateMinutes: 0 };
      const totalHours =
        row.totalHours ?? computeTotalHours(row.checkInTime, row.checkOutTime);

      prepared.push(
        this.toManagerEntry(row, actor, markedBy, {
          isLate,
          lateMinutes,
          totalHours,
        }),
      );
    }

    return this.attendance.upsertManagerEntries(prepared);
  }

  /**
   * Cashier self check-in. Resolves the actor's employee row,
   * refuses if today is already marked Leave/Holiday/Weekend or if a
   * check-in is already on file. Stamps `markedBy='Cashier_Self'`
   * and `status='Present'`.
   */
  async checkInSelf(actor: AttendanceActor, now: Date): Promise<Attendance> {
    const employee = await this.findEmployeeForUser(actor.id);
    const today = todayDate(now);
    const existing = await this.attendance.findByEmployeeAndDate(
      employee.id,
      today,
    );

    if (existing) {
      if (
        existing.status === 'Leave' ||
        existing.status === 'Holiday' ||
        existing.status === 'Weekend'
      ) {
        throw new BadRequestException(
          `Already marked ${existing.status} for today`,
        );
      }
      if (existing.checkInTime) {
        throw new BadRequestException(
          `Already checked in at ${existing.checkInTime}`,
        );
      }
    }

    const checkInTime = formatClock(now);
    const grace = await this.resolveGraceMinutes(employee.branchId);
    const { isLate, lateMinutes } = computeLate(
      checkInTime,
      employee.workingHoursStart,
      grace,
    );

    return this.attendance.upsertCheckIn({
      employeeId: employee.id,
      attendanceDate: today,
      checkInTime,
      isLate,
      lateMinutes,
      createdBy: actor.id,
    });
  }

  /**
   * Cashier self check-out. Requires a check-in already on file for
   * today. Computes `totalHours` from the existing check-in and
   * `overtimeHours` as anything past `employee.workingHoursEnd`.
   */
  async checkOutSelf(actor: AttendanceActor, now: Date): Promise<Attendance> {
    const employee = await this.findEmployeeForUser(actor.id);
    const today = todayDate(now);
    const existing = await this.attendance.findByEmployeeAndDate(
      employee.id,
      today,
    );

    if (!existing || !existing.checkInTime) {
      throw new BadRequestException('Check in first');
    }
    if (existing.checkOutTime) {
      throw new BadRequestException(
        `Already checked out at ${existing.checkOutTime}`,
      );
    }

    const checkOutTime = formatClock(now);
    const totalHours = computeTotalHours(existing.checkInTime, checkOutTime);
    const { isOvertime, overtimeHours } = computeOvertime(
      checkOutTime,
      employee.workingHoursEnd,
    );

    return this.attendance.applyCheckOut(employee.id, today, {
      checkOutTime,
      totalHours: totalHours ?? 0,
      isOvertime,
      overtimeHours,
    });
  }

  // -------------------------------------------------------------------
  // Helpers

  /**
   * Resolve the late-grace window for a branch via the payroll
   * settings service. Cached per-branch when a cache is provided so a
   * bulk grid doesn't fan out into repeat lookups for the same row.
   * If the settings service throws (deployment-level invariant
   * broken), we fall back to 15 minutes rather than 5xx every
   * check-in.
   */
  private async resolveGraceMinutes(
    branchId: string | null,
    cache?: Map<string, number>,
  ): Promise<number> {
    const key = branchId ?? '__global__';
    if (cache) {
      const cached = cache.get(key);
      if (cached !== undefined) return cached;
    }
    let grace = FALLBACK_GRACE_MINUTES;
    try {
      const row = await this.payrollSettings.getEffective(branchId);
      grace = row.lateGraceMinutes;
    } catch {
      grace = FALLBACK_GRACE_MINUTES;
    }
    if (cache) cache.set(key, grace);
    return grace;
  }

  private async findEmployeeForUser(userId: string): Promise<Employee> {
    // Go through the repository (rules §7) so the data-access path
    // stays consistent with the rest of the HR module.
    const employee = await this.employees.findByUserId(userId);
    if (!employee) {
      throw new NotFoundException(
        'No employee profile is linked to this account',
      );
    }
    if (employee.status !== 'Active') {
      throw new ForbiddenException(
        `Employee status is ${employee.status} — check-in disabled`,
      );
    }
    return employee;
  }

  private async resolveEmployee(
    employeeId: string,
    actor: AttendanceActor,
    cache: Map<string, Employee>,
  ): Promise<Employee> {
    const cached = cache.get(employeeId);
    if (cached) return cached;
    const employee = await this.employees.findById(employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
    if (actor.role !== UserRole.ADMIN && employee.branchId !== actor.branchId) {
      throw new ForbiddenException(
        `Employee ${employee.employeeCode} is outside your branch`,
      );
    }
    cache.set(employeeId, employee);
    return employee;
  }

  private toManagerEntry(
    row: BulkAttendanceRowDto,
    actor: AttendanceActor,
    markedBy: Attendance['markedBy'],
    derived: {
      isLate: boolean;
      lateMinutes: number;
      totalHours: number | null;
    },
  ): Parameters<AttendanceRepository['upsertManagerEntry']>[0] {
    return {
      employeeId: row.employeeId,
      attendanceDate: new Date(row.attendanceDate),
      checkInTime: row.checkInTime ?? null,
      checkOutTime: row.checkOutTime ?? null,
      totalHours: derived.totalHours,
      status: row.status,
      isLate: derived.isLate,
      lateMinutes: derived.lateMinutes,
      isOvertime: row.isOvertime ?? false,
      overtimeHours: row.overtimeHours ?? 0,
      markedBy,
      cardsProduced: row.cardsProduced ?? 0,
      notes: row.notes ?? null,
      createdBy: actor.id,
    };
  }
}
