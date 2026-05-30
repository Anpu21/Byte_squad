import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { PayrollRepository } from '@/modules/hr/payroll.repository';
import { EmployeesRepository } from '@/modules/hr/employees.repository';
import { AttendanceRepository } from '@/modules/hr/attendance.repository';
import { SalaryStructuresRepository } from '@/modules/hr/salary-structures.repository';
import { PayrollSettingsService } from '@/modules/hr/payroll-settings.service';
import { Payroll } from '@/modules/hr/entities/payroll.entity';
import { ListPayrollQueryDto } from '@/modules/hr/dto/list-payroll-query.dto';
import { GeneratePayrollDto } from '@/modules/hr/dto/generate-payroll.dto';
import { MarkPayrollPaidDto } from '@/modules/hr/dto/mark-payroll-paid.dto';
import { ExportPayrollCsvQueryDto } from '@/modules/hr/dto/export-payroll-csv-query.dto';
import {
  BANK_CSV_HEADER,
  buildPayrollRow,
  formatBankCsv,
  summarizeAttendanceRows,
} from '@/modules/hr/payroll-math';

export interface PayrollActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

export interface PayrollListResponse {
  rows: Payroll[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * `skipped` carries inline warnings for employees the generator could
 * not run for — surfaced rather than thrown so one missing salary
 * structure doesn't abort the whole branch run.
 */
export interface GeneratePayrollResponse {
  rows: Payroll[];
  skipped: Array<{ employeeId: string; reason: string }>;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const GENERATE_EMPLOYEE_PAGE = 1000;

@Injectable()
export class PayrollService {
  constructor(
    private readonly payroll: PayrollRepository,
    private readonly employees: EmployeesRepository,
    private readonly attendance: AttendanceRepository,
    private readonly structures: SalaryStructuresRepository,
    private readonly settings: PayrollSettingsService,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    query: ListPayrollQueryDto,
    actor: PayrollActor,
  ): Promise<PayrollListResponse> {
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const offset = Math.max(query.offset ?? 0, 0);
    const branchId = this.resolveBranchScope(actor, query.branchId);

    const { rows, total } = await this.payroll.listForBranch({
      branchId,
      employeeId: query.employeeId,
      month: query.month,
      year: query.year,
      status: query.status,
      limit,
      offset,
    });
    return { rows, total, limit, offset };
  }

  async getById(id: string, actor: PayrollActor): Promise<Payroll> {
    const row = await this.payroll.findById(id);
    if (!row) throw new NotFoundException('Payroll not found');
    await this.assertVisible(row, actor);
    return row;
  }

  /**
   * Run the monthly payroll for every Active employee in the resolved
   * branch. Wrapped in one transaction so a partial failure rolls back
   * cleanly. Per employee: resolve the SalaryStructure active on the
   * period midpoint (15th — skip with a structured warning if none),
   * summarize attendance for the [first, last] window, compose via the
   * pure `buildPayrollRow` helper (honours `epfEligible` /
   * `etfEligible` + the branch-aware PayrollSettings), upsert. A
   * re-run may only mutate Pending drafts — an existing Approved /
   * Paid / Cancelled row throws 409 so the whole transaction unwinds.
   */
  async generate(
    args: GeneratePayrollDto,
    actor: PayrollActor,
  ): Promise<GeneratePayrollResponse> {
    const branchId = this.resolveBranchScope(actor, args.branchId);
    const settings = await this.settings.getEffective(branchId ?? null);
    const periodStart = new Date(Date.UTC(args.year, args.month - 1, 1));
    const periodEnd = new Date(Date.UTC(args.year, args.month, 0));
    const periodMidpoint = new Date(Date.UTC(args.year, args.month - 1, 15));

    const { rows: employees } = await this.employees.listForBranch({
      branchId,
      status: 'Active',
      limit: GENERATE_EMPLOYEE_PAGE,
      offset: 0,
    });

    return this.dataSource.transaction(async (manager) => {
      const generated: Payroll[] = [];
      const skipped: GeneratePayrollResponse['skipped'] = [];

      for (const employee of employees) {
        const structure = await this.structures.findActiveOn(
          employee.id,
          periodMidpoint,
        );
        if (!structure) {
          skipped.push({
            employeeId: employee.id,
            reason: `No active salary structure for ${employee.employeeCode}`,
          });
          continue;
        }

        const existing = await this.payroll.findExisting(
          employee.id,
          args.month,
          args.year,
          manager,
        );
        if (existing && existing.paymentStatus !== 'Pending') {
          throw new ConflictException(
            `Payroll for ${employee.employeeCode} ${args.year}-${String(args.month).padStart(2, '0')} is ${existing.paymentStatus} and cannot be regenerated`,
          );
        }

        const attendanceRows = await this.attendance.listForBranch({
          employeeId: employee.id,
          startDate: periodStart,
          endDate: periodEnd,
        });
        const row = buildPayrollRow({
          employee,
          structure,
          summary: summarizeAttendanceRows(attendanceRows),
          month: args.month,
          year: args.year,
          settings: {
            epfEmployeePercent: settings.epfEmployeePercent,
            epfEmployerPercent: settings.epfEmployerPercent,
            etfEmployerPercent: settings.etfEmployerPercent,
            attendanceBonusThreshold: settings.attendanceBonusThreshold,
          },
          generatedBy: actor.id,
          existingId: existing?.id,
        });

        generated.push(await this.payroll.upsert(row, manager));
      }

      return { rows: generated, skipped };
    });
  }

  async approve(id: string, actor: PayrollActor): Promise<Payroll> {
    const existing = await this.getById(id, actor);
    if (existing.paymentStatus !== 'Pending') {
      throw new ConflictException(
        `Cannot approve payroll in status ${existing.paymentStatus}`,
      );
    }
    const updated = await this.payroll.updatePartial(id, {
      paymentStatus: 'Approved',
      approvedBy: actor.id,
    });
    if (!updated) throw new NotFoundException('Payroll vanished after approve');
    return updated;
  }

  async markPaid(
    id: string,
    dto: MarkPayrollPaidDto,
    actor: PayrollActor,
  ): Promise<Payroll> {
    const existing = await this.getById(id, actor);
    if (existing.paymentStatus !== 'Approved') {
      throw new ConflictException(
        `Cannot mark Paid: payroll is ${existing.paymentStatus}`,
      );
    }
    const updated = await this.payroll.updatePartial(id, {
      paymentStatus: 'Paid',
      paymentDate: new Date(dto.paymentDate),
      paymentMethod: dto.paymentMethod,
      bankReferenceNo: dto.bankReferenceNo ?? null,
    });
    if (!updated)
      throw new NotFoundException('Payroll vanished after mark-paid');
    return updated;
  }

  async cancel(id: string, actor: PayrollActor): Promise<Payroll> {
    const existing = await this.getById(id, actor);
    if (existing.paymentStatus === 'Paid') {
      throw new ConflictException(
        'Cannot cancel a Paid payroll — money has already been disbursed',
      );
    }
    if (existing.paymentStatus === 'Cancelled') {
      throw new ConflictException('Payroll is already Cancelled');
    }
    const updated = await this.payroll.updatePartial(id, {
      paymentStatus: 'Cancelled',
    });
    if (!updated) throw new NotFoundException('Payroll vanished after cancel');
    return updated;
  }

  /**
   * Bank-disbursement CSV for the period. Returns one row per
   * Approved-or-Paid payroll. Missing bank details surface as quoted
   * empty fields so the bank's loader still sees a complete row — the
   * admin is responsible for chasing the missing details before
   * forwarding.
   */
  async exportCsv(
    args: ExportPayrollCsvQueryDto,
    actor: PayrollActor,
  ): Promise<string> {
    const { rows } = await this.payroll.listForBranch({
      branchId: this.resolveBranchScope(actor, args.branchId),
      month: args.month,
      year: args.year,
      status: ['Approved', 'Paid'],
      limit: MAX_LIMIT,
      offset: 0,
    });
    if (rows.length === 0) return `${BANK_CSV_HEADER}\n`;
    const employees = await Promise.all(
      rows.map((r) => this.employees.findById(r.employeeId)),
    );
    const pairs = rows
      .map((p, i) => {
        const e = employees[i];
        if (!e) return null;
        return {
          employeeCode: e.employeeCode,
          bankName: e.bankName,
          bankBranch: e.bankBranch,
          bankAccountNo: e.bankAccountNo,
          bankAccountName: e.bankAccountName,
          netSalary: p.netSalary,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return formatBankCsv(pairs);
  }

  // -------------------------------------------------------------------
  // Helpers

  /**
   * Managers are pinned to their own branch — the URL cannot widen
   * scope. Admins may pass any `branchId` or omit it to span all
   * branches; the generator and CSV export both honour the same rule.
   */
  private resolveBranchScope(
    actor: PayrollActor,
    branchId: string | undefined,
  ): string | undefined {
    if (actor.role === UserRole.ADMIN) return branchId;
    return actor.branchId ?? undefined;
  }

  private async assertVisible(
    payroll: Payroll,
    actor: PayrollActor,
  ): Promise<void> {
    if (actor.role === UserRole.ADMIN) return;
    const employee = await this.employees.findById(payroll.employeeId);
    if (!employee) throw new NotFoundException('Payroll not found');
    if (employee.branchId !== actor.branchId) {
      throw new ForbiddenException('Cannot access payroll outside your branch');
    }
  }
}
