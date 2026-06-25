import type { Attendance } from '@/modules/hr-attendance/entities/attendance.entity';
import type { Employee } from '@/modules/hr-employees/entities/employee.entity';
import type { Payroll } from '@/modules/hr-payroll/entities/payroll.entity';
import type { SalaryStructure } from '@/modules/hr-salary-structures/entities/salary-structure.entity';

/**
 * Pure earnings / deductions / contributions helpers for the payroll
 * generator. Extracted from `payroll.service.ts` to keep the service
 * under the 300-line cap (precedent: `attendance-math.ts`) and to make
 * each calculation unit-testable in isolation.
 *
 * Every numeric result is rounded to 2dp so the persisted decimal(10,2)
 * columns never carry hidden binary float drift between generation and
 * approval reads.
 *
 * `etfEmployeeDeduction` is always 0 — the Sri Lankan ETF is an
 * employer-only contribution. The column lives on the payroll row for
 * report parity with the Shanel-port schema; the deduction stays zero
 * regardless of `etfEmployerPercent`.
 */

export interface MonthlyAttendance {
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  lateDays: number;
  totalOvertimeHours: number;
  totalCardsProduced: number;
}

export interface GrossInput {
  basicSalary: number;
  productionEarnings: number;
  overtimeEarnings: number;
  attendanceBonus: number;
  teaAllowance: number;
  otherAllowances: number;
}

export interface DeductionsInput {
  gross: number;
  epfEmployeePercent: number;
  /**
   * Employer-side ETF percent. Kept on the input shape so the helper
   * stays a one-stop call site even though the employee deduction is
   * always 0 (see file header).
   */
  etfEmployerPercent: number;
  advanceDeduction: number;
  otherDeductions: number;
}

export interface DeductionsResult {
  epfEmployeeDeduction: number;
  etfEmployeeDeduction: number;
  totalDeductions: number;
}

export interface EmployerContributions {
  epfEmployer: number;
  etfEmployer: number;
}

export interface PayrollSettingsSnapshot {
  epfEmployeePercent: number;
  epfEmployerPercent: number;
  etfEmployerPercent: number;
  attendanceBonusThreshold: number;
}

export interface BuildPayrollRowArgs {
  employee: Employee;
  structure: SalaryStructure;
  summary: MonthlyAttendance;
  month: number;
  year: number;
  settings: PayrollSettingsSnapshot;
  generatedBy: string;
  existingId?: string;
}

/**
 * Sum the six earnings components and round to 2dp. The components are
 * expected to already be rounded by the caller (see
 * `computeBasicMonthly`, etc.) but the final round-trip protects
 * against accumulated drift when a caller skips the per-component
 * round.
 */
export function computeGross(args: GrossInput): number {
  const sum =
    args.basicSalary +
    args.productionEarnings +
    args.overtimeEarnings +
    args.attendanceBonus +
    args.teaAllowance +
    args.otherAllowances;
  return round2(sum);
}

/**
 * Returns the three deduction components. `epfEmployeeDeduction` is
 * `gross * epfEmployeePercent / 100`; `etfEmployeeDeduction` is always
 * 0; `totalDeductions` sums all four (EPF emp + ETF emp + advance +
 * other).
 *
 * The caller is responsible for honouring the employee's `epfEligible`
 * flag — pass `epfEmployeePercent: 0` for ineligible staff.
 */
export function computeDeductions(args: DeductionsInput): DeductionsResult {
  const epfEmployee = round2((args.gross * args.epfEmployeePercent) / 100);
  const etfEmployee = 0;
  const total = round2(
    epfEmployee + etfEmployee + args.advanceDeduction + args.otherDeductions,
  );
  return {
    epfEmployeeDeduction: epfEmployee,
    etfEmployeeDeduction: etfEmployee,
    totalDeductions: total,
  };
}

/**
 * Employer-side EPF + ETF contributions. Stored on the payroll row for
 * the bank-reconciliation report — they do NOT reduce the employee's
 * net.
 */
export function computeEmployerContributions(
  gross: number,
  epfEmployerPercent: number,
  etfEmployerPercent: number,
): EmployerContributions {
  return {
    epfEmployer: round2((gross * epfEmployerPercent) / 100),
    etfEmployer: round2((gross * etfEmployerPercent) / 100),
  };
}

export function computeNet(gross: number, totalDeductions: number): number {
  return round2(gross - totalDeductions);
}

/**
 * Round to 2dp with the half-away-from-zero convention. Avoids the
 * `Math.round` banker's-rounding surprise on .5 — `99.995 → 100.00`
 * rather than `99.99`. Implemented via the `Math.round((n + ε) * 100)`
 * trick so the persisted decimal(10,2) columns are predictable.
 */
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// -------------------------------------------------------------------
// Salary-type-aware earnings helpers — kept here so the service can
// stay a thin orchestrator.

/**
 * Monthly_Fixed basic salary calculation. The MVP rule: pay the full
 * `monthlyBase` when present + leave days meet the bonus threshold (a
 * proxy for "full month"); otherwise pro-rate by
 * `(present + leave) / threshold`.
 *
 * This is deliberately simpler than calendar-day proration — the
 * production rules document this is the "MVP simplification" and HR
 * will revisit once the manual-override flow lands.
 */
export function computeBasicMonthly(
  monthlyBase: number,
  presentDays: number,
  leaveDays: number,
  attendanceThreshold: number,
): number {
  const worked = presentDays + leaveDays;
  if (attendanceThreshold <= 0 || worked >= attendanceThreshold) {
    return round2(monthlyBase);
  }
  return round2((monthlyBase * worked) / attendanceThreshold);
}

/**
 * Production_Based basic earnings. `cardsProduced * ratePerCard` —
 * straightforward. The `basicSalary` column stays 0 for this type;
 * this is `productionEarnings`.
 */
export function computeProductionEarnings(
  cardsProduced: number,
  ratePerCard: number,
): number {
  return round2(cardsProduced * ratePerCard);
}

export function computeOvertimeEarnings(
  overtimeHours: number,
  ratePerHour: number,
): number {
  return round2(overtimeHours * ratePerHour);
}

export function computeTeaAllowance(
  presentDays: number,
  teaAllowanceDaily: number,
): number {
  return round2(presentDays * teaAllowanceDaily);
}

export function computeAttendanceBonus(
  presentDays: number,
  threshold: number,
  bonusAmount: number,
): number {
  if (threshold <= 0) return round2(bonusAmount);
  return presentDays >= threshold ? round2(bonusAmount) : 0;
}

/**
 * Aggregate attendance rows in memory. ≤ 31 rows per employee per
 * month so the in-process roll-up is cheaper than a separate SQL
 * aggregate query (and keeps the shape trivially testable).
 *
 * A `Half_Day` row earns half a present credit so the attendance bonus
 * and tea allowance math stays linear. `Holiday` and `Weekend` rows
 * neither earn nor count against the bonus threshold.
 */
export function summarizeAttendanceRows(rows: Attendance[]): MonthlyAttendance {
  const summary: MonthlyAttendance = {
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    halfDays: 0,
    lateDays: 0,
    totalOvertimeHours: 0,
    totalCardsProduced: 0,
  };
  for (const row of rows) {
    switch (row.status) {
      case 'Present':
        summary.presentDays += 1;
        break;
      case 'Absent':
        summary.absentDays += 1;
        break;
      case 'Leave':
        summary.leaveDays += 1;
        break;
      case 'Half_Day':
        summary.halfDays += 1;
        summary.presentDays += 0.5;
        break;
      case 'Holiday':
      case 'Weekend':
        break;
    }
    if (row.isLate) summary.lateDays += 1;
    summary.totalOvertimeHours += Number(row.overtimeHours ?? 0);
    summary.totalCardsProduced += row.cardsProduced;
  }
  return summary;
}

/**
 * Compose a Payroll row payload from the salary structure, attendance
 * summary, and effective settings. Pure — does not touch the database.
 * The service drives the IO around it (load structure, load attendance,
 * upsert the returned shape).
 */
export function buildPayrollRow(args: BuildPayrollRowArgs): Partial<Payroll> {
  const { employee, structure, summary, settings } = args;
  const basicSalary =
    structure.salaryType === 'Monthly_Fixed'
      ? computeBasicMonthly(
          structure.monthlyBase,
          summary.presentDays,
          summary.leaveDays,
          settings.attendanceBonusThreshold,
        )
      : 0;
  const productionEarnings =
    structure.salaryType === 'Production_Based'
      ? computeProductionEarnings(
          summary.totalCardsProduced,
          structure.productionRatePerCard,
        )
      : 0;
  const overtimeEarnings = computeOvertimeEarnings(
    summary.totalOvertimeHours,
    structure.otRatePerHour,
  );
  const teaAllowance = computeTeaAllowance(
    summary.presentDays,
    structure.teaAllowanceDaily,
  );
  const attendanceBonus = computeAttendanceBonus(
    summary.presentDays,
    settings.attendanceBonusThreshold,
    structure.attendanceBonusAmount,
  );
  const grossSalary = computeGross({
    basicSalary,
    productionEarnings,
    overtimeEarnings,
    attendanceBonus,
    teaAllowance,
    otherAllowances: 0,
  });
  const deductions = computeDeductions({
    gross: grossSalary,
    epfEmployeePercent: employee.epfEligible ? settings.epfEmployeePercent : 0,
    etfEmployerPercent: settings.etfEmployerPercent,
    advanceDeduction: 0,
    otherDeductions: 0,
  });
  const employer = computeEmployerContributions(
    grossSalary,
    employee.epfEligible ? settings.epfEmployerPercent : 0,
    employee.etfEligible ? settings.etfEmployerPercent : 0,
  );
  const netSalary = computeNet(grossSalary, deductions.totalDeductions);

  return {
    ...(args.existingId ? { id: args.existingId } : {}),
    employeeId: employee.id,
    payPeriodMonth: args.month,
    payPeriodYear: args.year,
    basicSalary,
    productionEarnings,
    overtimeEarnings,
    attendanceBonus,
    teaAllowance,
    otherAllowances: 0,
    grossSalary,
    epfEmployeeDeduction: deductions.epfEmployeeDeduction,
    etfEmployeeDeduction: deductions.etfEmployeeDeduction,
    advanceDeduction: 0,
    otherDeductions: 0,
    totalDeductions: deductions.totalDeductions,
    netSalary,
    epfEmployerContribution: employer.epfEmployer,
    etfEmployerContribution: employer.etfEmployer,
    paymentStatus: 'Pending',
    generatedBy: args.generatedBy,
  };
}

/**
 * CSV field escape. Wraps the value in double quotes when it contains
 * any of `,`, `"`, `\n`, or `\r`, doubling any embedded quotes. Numbers
 * round-trip via `String(n)` so the reader sees `1500.50` not `1500.5`.
 *
 * `null` / `undefined` collapse to `""` so a missing field still holds
 * its column position in the row.
 */
export function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = typeof value === 'number' ? String(value) : value;
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Render a `date` value (Date or `YYYY-MM-DD` string) as `YYYY-MM-DD`, `''` when null. */
function formatCsvDate(value: Date | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export const PAYROLL_CSV_HEADER = [
  'employee_code',
  'employee_name',
  'pay_period',
  'gross_salary',
  'net_salary',
  'payment_method',
  'payment_status',
  'payment_date',
].join(',');

/**
 * Format the payroll export CSV — one row per payroll. A plain record of
 * each run (who, which period, the gross/net, and how it was paid); no
 * bank details. Returns a string ending with a trailing newline so a
 * reader can stream the result directly without re-terminating.
 */
export function formatPayrollCsv(
  rows: Array<{
    employeeCode: string;
    employeeName: string;
    payPeriodMonth: number;
    payPeriodYear: number;
    grossSalary: number;
    netSalary: number;
    paymentMethod: string;
    paymentStatus: string;
    paymentDate: Date | string | null;
  }>,
): string {
  const lines = [PAYROLL_CSV_HEADER];
  for (const r of rows) {
    const period = `${r.payPeriodYear}-${String(r.payPeriodMonth).padStart(2, '0')}`;
    lines.push(
      [
        csvField(r.employeeCode),
        csvField(r.employeeName),
        csvField(period),
        csvField(r.grossSalary),
        csvField(r.netSalary),
        csvField(r.paymentMethod),
        csvField(r.paymentStatus),
        csvField(formatCsvDate(r.paymentDate)),
      ].join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}
