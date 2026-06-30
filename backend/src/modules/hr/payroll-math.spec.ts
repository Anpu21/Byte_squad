import {
  PAYROLL_CSV_HEADER,
  buildPayrollRow,
  computeAttendanceBonus,
  computeBasicMonthly,
  computeDeductions,
  computeEmployerContributions,
  computeGross,
  computeNet,
  computeOvertimeEarnings,
  computeProductionEarnings,
  computeTeaAllowance,
  csvField,
  formatPayrollCsv,
  round2,
  summarizeAttendanceRows,
} from './payroll-math';
import type { Attendance } from './entities/attendance.entity';
import type { Employee } from './entities/employee.entity';
import type { SalaryStructure } from './entities/salary-structure.entity';

function makeEmployee(over: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-1',
    employeeCode: 'EMP001',
    branchId: 'branch-1',
    fullName: 'Jane Doe',
    epfEligible: true,
    etfEligible: true,
    bankName: 'Sampath',
    bankBranch: 'Colombo Main',
    bankAccountNo: '1234567890',
    bankAccountName: 'Jane Doe',
    ...over,
  } as Employee;
}

function makeStructure(over: Partial<SalaryStructure> = {}): SalaryStructure {
  return {
    id: 'struct-1',
    employeeId: 'emp-1',
    salaryType: 'Monthly_Fixed',
    monthlyBase: 100000,
    dailyRate: 0,
    productionRatePerCard: 0,
    teaAllowanceDaily: 60,
    otRatePerHour: 400,
    attendanceBonusAmount: 5000,
    ...over,
  } as SalaryStructure;
}

function makeAttendance(over: Partial<Attendance> = {}): Attendance {
  return {
    id: 'att-1',
    employeeId: 'emp-1',
    attendanceDate: new Date('2026-05-01'),
    checkInTime: '08:00:00',
    checkOutTime: '17:00:00',
    totalHours: 9,
    status: 'Present',
    isLate: false,
    lateMinutes: 0,
    isOvertime: false,
    overtimeHours: 0,
    markedBy: 'Manual',
    cardsProduced: 0,
    notes: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Attendance;
}

describe('payroll-math', () => {
  describe('round2', () => {
    it('rounds to two decimal places half-away-from-zero', () => {
      expect(round2(99.995)).toBe(100.0);
      expect(round2(1.005)).toBe(1.01);
      expect(round2(123.456)).toBe(123.46);
    });

    it('returns 0 for NaN / Infinity', () => {
      expect(round2(Number.NaN)).toBe(0);
      expect(round2(Number.POSITIVE_INFINITY)).toBe(0);
    });
  });

  describe('computeGross', () => {
    it('sums the six earnings components and rounds to 2dp', () => {
      const gross = computeGross({
        basicSalary: 100000,
        productionEarnings: 5000.123,
        overtimeEarnings: 2000,
        attendanceBonus: 1500,
        teaAllowance: 1560,
        otherAllowances: 0,
      });
      expect(gross).toBe(110060.12);
    });

    it('handles all-zero components', () => {
      expect(
        computeGross({
          basicSalary: 0,
          productionEarnings: 0,
          overtimeEarnings: 0,
          attendanceBonus: 0,
          teaAllowance: 0,
          otherAllowances: 0,
        }),
      ).toBe(0);
    });
  });

  describe('computeDeductions', () => {
    it('computes EPF employee as gross * percent / 100', () => {
      const out = computeDeductions({
        gross: 100000,
        epfEmployeePercent: 8,
        etfEmployerPercent: 3,
        advanceDeduction: 0,
        otherDeductions: 0,
      });
      expect(out.epfEmployeeDeduction).toBe(8000);
    });

    it('keeps etfEmployeeDeduction at 0 regardless of etfEmployerPercent', () => {
      const out = computeDeductions({
        gross: 100000,
        epfEmployeePercent: 8,
        etfEmployerPercent: 3,
        advanceDeduction: 0,
        otherDeductions: 0,
      });
      expect(out.etfEmployeeDeduction).toBe(0);
    });

    it('sums epf + advance + other into totalDeductions', () => {
      const out = computeDeductions({
        gross: 100000,
        epfEmployeePercent: 8,
        etfEmployerPercent: 3,
        advanceDeduction: 5000,
        otherDeductions: 1000,
      });
      expect(out.totalDeductions).toBe(8000 + 5000 + 1000);
    });
  });

  describe('computeEmployerContributions', () => {
    it('computes EPF + ETF employer side', () => {
      const out = computeEmployerContributions(100000, 12, 3);
      expect(out.epfEmployer).toBe(12000);
      expect(out.etfEmployer).toBe(3000);
    });
  });

  describe('computeNet', () => {
    it('returns gross minus total deductions', () => {
      expect(computeNet(100000, 8000)).toBe(92000);
    });

    it('rounds to 2dp', () => {
      expect(computeNet(100.555, 0.111)).toBe(100.44);
    });
  });

  describe('computeBasicMonthly', () => {
    it('pays the full monthlyBase when worked >= threshold', () => {
      expect(computeBasicMonthly(100000, 26, 0, 26)).toBe(100000);
      expect(computeBasicMonthly(100000, 20, 6, 26)).toBe(100000);
    });

    it('pro-rates by (present + leave) / threshold when worked < threshold', () => {
      expect(computeBasicMonthly(100000, 13, 0, 26)).toBe(50000);
      expect(computeBasicMonthly(100000, 10, 3, 26)).toBe(50000);
    });

    it('treats threshold <= 0 as "no proration"', () => {
      expect(computeBasicMonthly(100000, 0, 0, 0)).toBe(100000);
    });
  });

  describe('computeProductionEarnings', () => {
    it('returns cards * rate rounded to 2dp', () => {
      expect(computeProductionEarnings(120, 150)).toBe(18000);
      expect(computeProductionEarnings(100, 33.333)).toBe(3333.3);
    });
  });

  describe('computeOvertimeEarnings', () => {
    it('returns hours * rate rounded to 2dp', () => {
      expect(computeOvertimeEarnings(5, 400)).toBe(2000);
      expect(computeOvertimeEarnings(2.5, 350.75)).toBe(876.88);
    });
  });

  describe('computeTeaAllowance', () => {
    it('returns presentDays * daily', () => {
      expect(computeTeaAllowance(26, 60)).toBe(1560);
    });
  });

  describe('computeAttendanceBonus', () => {
    it('pays the bonus when present >= threshold', () => {
      expect(computeAttendanceBonus(26, 26, 5000)).toBe(5000);
      expect(computeAttendanceBonus(28, 26, 5000)).toBe(5000);
    });

    it('pays zero when present < threshold', () => {
      expect(computeAttendanceBonus(25, 26, 5000)).toBe(0);
    });
  });

  describe('summarizeAttendanceRows', () => {
    it('counts each status into the matching bucket', () => {
      const rows = [
        makeAttendance({ status: 'Present' }),
        makeAttendance({ status: 'Present' }),
        makeAttendance({ status: 'Leave' }),
        makeAttendance({ status: 'Absent' }),
        makeAttendance({ status: 'Holiday' }),
        makeAttendance({ status: 'Weekend' }),
        makeAttendance({ status: 'Half_Day' }),
      ];
      const summary = summarizeAttendanceRows(rows);
      expect(summary.presentDays).toBe(2.5);
      expect(summary.leaveDays).toBe(1);
      expect(summary.absentDays).toBe(1);
      expect(summary.halfDays).toBe(1);
    });

    it('rolls up totalOvertimeHours, lateDays, and cardsProduced', () => {
      const rows = [
        makeAttendance({
          isLate: true,
          overtimeHours: 2,
          cardsProduced: 50,
        }),
        makeAttendance({
          isLate: false,
          overtimeHours: 1.5,
          cardsProduced: 60,
        }),
      ];
      const summary = summarizeAttendanceRows(rows);
      expect(summary.lateDays).toBe(1);
      expect(summary.totalOvertimeHours).toBe(3.5);
      expect(summary.totalCardsProduced).toBe(110);
    });
  });

  describe('buildPayrollRow', () => {
    const settings = {
      epfEmployeePercent: 8,
      epfEmployerPercent: 12,
      etfEmployerPercent: 3,
      attendanceBonusThreshold: 26,
    };

    it('Monthly_Fixed full month: basic = monthlyBase, plus tea / OT / bonus', () => {
      const row = buildPayrollRow({
        employee: makeEmployee(),
        structure: makeStructure({
          monthlyBase: 100000,
          attendanceBonusAmount: 5000,
        }),
        summary: {
          presentDays: 26,
          absentDays: 0,
          leaveDays: 0,
          halfDays: 0,
          lateDays: 0,
          totalOvertimeHours: 5,
          totalCardsProduced: 0,
        },
        month: 5,
        year: 2026,
        settings,
        generatedBy: 'admin-1',
      });
      expect(row.basicSalary).toBe(100000);
      expect(row.productionEarnings).toBe(0);
      expect(row.overtimeEarnings).toBe(2000);
      expect(row.teaAllowance).toBe(26 * 60);
      expect(row.attendanceBonus).toBe(5000);
      expect(row.grossSalary).toBe(100000 + 2000 + 1560 + 5000);
      expect(row.epfEmployeeDeduction).toBe(round2((108560 * 8) / 100));
      expect(row.epfEmployerContribution).toBe(round2((108560 * 12) / 100));
      expect(row.etfEmployerContribution).toBe(round2((108560 * 3) / 100));
      expect(row.etfEmployeeDeduction).toBe(0);
      expect(row.netSalary).toBe(round2(108560 - round2((108560 * 8) / 100)));
      expect(row.paymentStatus).toBe('Pending');
    });

    it('Production_Based: productionEarnings = cards * rate, basicSalary = 0', () => {
      const row = buildPayrollRow({
        employee: makeEmployee({ epfEligible: false, etfEligible: false }),
        structure: makeStructure({
          salaryType: 'Production_Based',
          monthlyBase: 0,
          productionRatePerCard: 150,
          attendanceBonusAmount: 0,
        }),
        summary: {
          presentDays: 26,
          absentDays: 0,
          leaveDays: 0,
          halfDays: 0,
          lateDays: 0,
          totalOvertimeHours: 0,
          totalCardsProduced: 120,
        },
        month: 5,
        year: 2026,
        settings,
        generatedBy: 'admin-1',
      });
      expect(row.basicSalary).toBe(0);
      expect(row.productionEarnings).toBe(120 * 150);
      // No EPF deduction for ineligible employees.
      expect(row.epfEmployeeDeduction).toBe(0);
      expect(row.epfEmployerContribution).toBe(0);
      expect(row.etfEmployerContribution).toBe(0);
    });

    it('Monthly_Fixed half-attendance: basic pro-rated to half', () => {
      const row = buildPayrollRow({
        employee: makeEmployee({ epfEligible: false, etfEligible: false }),
        structure: makeStructure({
          monthlyBase: 100000,
          attendanceBonusAmount: 5000,
        }),
        summary: {
          presentDays: 13,
          absentDays: 13,
          leaveDays: 0,
          halfDays: 0,
          lateDays: 0,
          totalOvertimeHours: 0,
          totalCardsProduced: 0,
        },
        month: 5,
        year: 2026,
        settings,
        generatedBy: 'admin-1',
      });
      expect(row.basicSalary).toBe(50000);
      // Below threshold → no attendance bonus.
      expect(row.attendanceBonus).toBe(0);
    });

    it('carries existingId through for re-runs (upsert collision target)', () => {
      const row = buildPayrollRow({
        employee: makeEmployee(),
        structure: makeStructure(),
        summary: {
          presentDays: 26,
          absentDays: 0,
          leaveDays: 0,
          halfDays: 0,
          lateDays: 0,
          totalOvertimeHours: 0,
          totalCardsProduced: 0,
        },
        month: 5,
        year: 2026,
        settings,
        generatedBy: 'admin-1',
        existingId: 'payroll-1',
      });
      expect(row.id).toBe('payroll-1');
    });
  });

  describe('csvField', () => {
    it('passes through plain values', () => {
      expect(csvField('EMP001')).toBe('EMP001');
      expect(csvField(1500.5)).toBe('1500.5');
    });

    it('wraps values with separators in quotes and doubles inner quotes', () => {
      expect(csvField('Hello, World')).toBe('"Hello, World"');
      expect(csvField('She said "hi"')).toBe('"She said ""hi"""');
      expect(csvField('line1\nline2')).toBe('"line1\nline2"');
    });

    it('quotes empty strings for null / undefined', () => {
      expect(csvField(null)).toBe('""');
      expect(csvField(undefined)).toBe('""');
    });
  });

  describe('formatPayrollCsv', () => {
    it('emits the header + one row per payroll, trailing newline', () => {
      const out = formatPayrollCsv([
        {
          employeeCode: 'EMP001',
          employeeName: 'Jane Doe',
          payPeriodMonth: 5,
          payPeriodYear: 2026,
          grossSalary: 106560,
          netSalary: 92000,
          paymentMethod: 'Card',
          paymentStatus: 'Paid',
          paymentDate: '2026-06-05',
        },
      ]);
      expect(out.startsWith(PAYROLL_CSV_HEADER)).toBe(true);
      expect(out.endsWith('\n')).toBe(true);
      expect(out).toContain(
        'EMP001,Jane Doe,2026-05,106560,92000,Card,Paid,2026-06-05',
      );
    });

    it('renders a null payment date as an empty field', () => {
      const out = formatPayrollCsv([
        {
          employeeCode: 'EMP002',
          employeeName: 'John Roe',
          payPeriodMonth: 12,
          payPeriodYear: 2026,
          grossSalary: 50000,
          netSalary: 46000,
          paymentMethod: 'Cash',
          paymentStatus: 'Approved',
          paymentDate: null,
        },
      ]);
      expect(out).toContain(
        'EMP002,John Roe,2026-12,50000,46000,Cash,Approved,',
      );
    });
  });
});
