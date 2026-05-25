import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Employee } from '@/modules/hr/entities/employee.entity';
import { SalaryStructure } from '@/modules/hr/entities/salary-structure.entity';
import { PayrollSettings } from '@/modules/hr/entities/payroll-settings.entity';
import { Attendance } from '@/modules/hr/entities/attendance.entity';
import { EmployeeLeave } from '@/modules/hr/entities/employee-leave.entity';
import { Payroll } from '@/modules/hr/entities/payroll.entity';

/**
 * Demo HR seed. Runs after the admin seed lands branches + users so it
 * can attach Employee rows to the cashier/manager accounts and stand
 * up a realistic month of attendance + a previous-period payroll run
 * for the new HR module screens.
 *
 * Every step is idempotent — guarded by either a unique key
 * (employeeCode, branchId, (employeeId, attendanceDate), etc.) or a
 * count check — so repeated container boots do not duplicate rows.
 */
export interface HrSeedContext {
  admin: User;
  mainBranch: Branch;
  downtownBranch: Branch;
  suburbanBranch: Branch;
  mainManager: User;
  downtownManager: User;
  suburbanManager: User;
  cashier1: User;
  cashier2: User;
  cashier3: User;
}

interface EmployeeSeed {
  employeeCode: string;
  fullName: string;
  contactPhone: string;
  branch: Branch;
  user?: User;
  role: string;
  monthlyBase: number;
  epfNumber?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankBranch?: string;
  annualLeaveBalance?: number;
}

const SL_EPF_EMPLOYEE = 8;
const SL_EPF_EMPLOYER = 12;
const SL_ETF_EMPLOYER = 3;

@Injectable()
export class HrSeedService {
  private readonly logger = new Logger(HrSeedService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    @InjectRepository(SalaryStructure)
    private readonly structures: Repository<SalaryStructure>,
    @InjectRepository(PayrollSettings)
    private readonly settings: Repository<PayrollSettings>,
    @InjectRepository(Attendance)
    private readonly attendance: Repository<Attendance>,
    @InjectRepository(EmployeeLeave)
    private readonly leaves: Repository<EmployeeLeave>,
    @InjectRepository(Payroll)
    private readonly payrolls: Repository<Payroll>,
  ) {}

  async seed(ctx: HrSeedContext): Promise<void> {
    this.logger.log('Running HR demo seed...');

    await this.ensureGlobalPayrollSettings(ctx.admin.id);

    const employeeSeeds = this.buildEmployeeSeeds(ctx);
    const employees = await this.ensureEmployees(employeeSeeds, ctx.admin.id);
    await this.ensureSalaryStructures(employees, employeeSeeds, ctx.admin.id);
    await this.ensureAttendance(employees, ctx.admin.id);
    await this.ensureLeaves(employees, ctx);
    await this.ensurePreviousPayroll(employees, ctx.admin.id);

    this.logger.log(`HR seed completed: ${employees.length} employees seeded.`);
  }

  // ── PayrollSettings ──────────────────────────────────────

  private async ensureGlobalPayrollSettings(adminId: string): Promise<void> {
    const existing = await this.settings.findOne({
      where: { branchId: null as unknown as string },
    });
    if (existing) return;
    await this.settings.save(
      this.settings.create({
        branchId: null,
        epfEmployeePercent: SL_EPF_EMPLOYEE,
        epfEmployerPercent: SL_EPF_EMPLOYER,
        etfEmployerPercent: SL_ETF_EMPLOYER,
        attendanceBonusThreshold: 26,
        lateGraceMinutes: 15,
        createdBy: adminId,
      }),
    );
  }

  // ── Employees ───────────────────────────────────────────

  /**
   * Three managers + three cashiers (linked to seeded user accounts)
   * plus three extra clerks (no login) so each branch has a small
   * but non-trivial roster for the attendance grid and payroll run.
   */
  private buildEmployeeSeeds(ctx: HrSeedContext): EmployeeSeed[] {
    return [
      // Main branch
      {
        employeeCode: 'EMP-MAIN-001',
        fullName: `${ctx.mainManager.firstName} ${ctx.mainManager.lastName}`,
        contactPhone: '+94770010001',
        branch: ctx.mainBranch,
        user: ctx.mainManager,
        role: 'Branch Manager',
        monthlyBase: 95_000,
        epfNumber: 'EPF-001',
        bankName: 'Commercial Bank',
        bankAccountNo: '8001234501',
        bankBranch: 'Colombo Main',
        annualLeaveBalance: 14,
      },
      {
        employeeCode: 'EMP-MAIN-002',
        fullName: `${ctx.cashier1.firstName} ${ctx.cashier1.lastName}`,
        contactPhone: '+94770010002',
        branch: ctx.mainBranch,
        user: ctx.cashier1,
        role: 'Cashier',
        monthlyBase: 45_000,
        epfNumber: 'EPF-002',
        bankName: 'Commercial Bank',
        bankAccountNo: '8001234502',
        bankBranch: 'Colombo Main',
        annualLeaveBalance: 12,
      },
      {
        employeeCode: 'EMP-MAIN-003',
        fullName: 'Nimal Perera',
        contactPhone: '+94770010003',
        branch: ctx.mainBranch,
        role: 'Stock Clerk',
        monthlyBase: 38_000,
        epfNumber: 'EPF-003',
        bankName: 'BOC',
        bankAccountNo: '7001234503',
        bankBranch: 'Pettah',
        annualLeaveBalance: 14,
      },
      // Downtown branch
      {
        employeeCode: 'EMP-DT-001',
        fullName: `${ctx.downtownManager.firstName} ${ctx.downtownManager.lastName}`,
        contactPhone: '+94770010101',
        branch: ctx.downtownBranch,
        user: ctx.downtownManager,
        role: 'Branch Manager',
        monthlyBase: 92_000,
        epfNumber: 'EPF-101',
        bankName: 'HNB',
        bankAccountNo: '6001234501',
        bankBranch: 'Downtown',
        annualLeaveBalance: 14,
      },
      {
        employeeCode: 'EMP-DT-002',
        fullName: `${ctx.cashier2.firstName} ${ctx.cashier2.lastName}`,
        contactPhone: '+94770010102',
        branch: ctx.downtownBranch,
        user: ctx.cashier2,
        role: 'Cashier',
        monthlyBase: 44_000,
        epfNumber: 'EPF-102',
        bankName: 'HNB',
        bankAccountNo: '6001234502',
        bankBranch: 'Downtown',
        annualLeaveBalance: 10,
      },
      {
        employeeCode: 'EMP-DT-003',
        fullName: 'Kamal Silva',
        contactPhone: '+94770010103',
        branch: ctx.downtownBranch,
        role: 'Stock Clerk',
        monthlyBase: 36_000,
        epfNumber: 'EPF-103',
        bankName: 'BOC',
        bankAccountNo: '7001234504',
        bankBranch: 'Pettah',
        annualLeaveBalance: 14,
      },
      // Suburban branch
      {
        employeeCode: 'EMP-SB-001',
        fullName: `${ctx.suburbanManager.firstName} ${ctx.suburbanManager.lastName}`,
        contactPhone: '+94770010201',
        branch: ctx.suburbanBranch,
        user: ctx.suburbanManager,
        role: 'Branch Manager',
        monthlyBase: 90_000,
        epfNumber: 'EPF-201',
        bankName: 'Sampath Bank',
        bankAccountNo: '5001234501',
        bankBranch: 'Suburban',
        annualLeaveBalance: 13,
      },
      {
        employeeCode: 'EMP-SB-002',
        fullName: `${ctx.cashier3.firstName} ${ctx.cashier3.lastName}`,
        contactPhone: '+94770010202',
        branch: ctx.suburbanBranch,
        user: ctx.cashier3,
        role: 'Cashier',
        monthlyBase: 42_000,
        epfNumber: 'EPF-202',
        bankName: 'Sampath Bank',
        bankAccountNo: '5001234502',
        bankBranch: 'Suburban',
        annualLeaveBalance: 14,
      },
      {
        employeeCode: 'EMP-SB-003',
        fullName: 'Anusha Fernando',
        contactPhone: '+94770010203',
        branch: ctx.suburbanBranch,
        role: 'Stock Clerk',
        monthlyBase: 35_000,
        epfNumber: 'EPF-203',
        bankName: 'Sampath Bank',
        bankAccountNo: '5001234503',
        bankBranch: 'Suburban',
        annualLeaveBalance: 14,
      },
    ];
  }

  private async ensureEmployees(
    seeds: EmployeeSeed[],
    adminId: string,
  ): Promise<Employee[]> {
    const result: Employee[] = [];
    for (const seed of seeds) {
      let employee = await this.employees.findOne({
        where: { employeeCode: seed.employeeCode },
      });
      if (!employee) {
        employee = await this.employees.save(
          this.employees.create({
            employeeCode: seed.employeeCode,
            userId: seed.user?.id ?? null,
            branchId: seed.branch.id,
            fullName: seed.fullName,
            contactPhone: seed.contactPhone,
            hireDate: new Date('2024-01-15'),
            employeeType: 'Permanent',
            role: seed.role,
            workingHoursStart: '09:00:00',
            workingHoursEnd: '18:00:00',
            epfEligible: true,
            etfEligible: true,
            epfNumber: seed.epfNumber ?? null,
            etfNumber: seed.epfNumber
              ? `ETF-${seed.epfNumber.replace('EPF-', '')}`
              : null,
            bankName: seed.bankName ?? null,
            bankAccountNo: seed.bankAccountNo ?? null,
            bankBranch: seed.bankBranch ?? null,
            bankAccountName: seed.fullName,
            status: 'Active',
            annualLeaveBalance: seed.annualLeaveBalance ?? 14,
            createdBy: adminId,
          }),
        );
      }
      result.push(employee);
    }
    return result;
  }

  // ── Salary structures ────────────────────────────────────

  private async ensureSalaryStructures(
    employees: Employee[],
    seeds: EmployeeSeed[],
    adminId: string,
  ): Promise<void> {
    for (const [index, employee] of employees.entries()) {
      const seed = seeds[index];
      if (!seed) continue;
      const existing = await this.structures.findOne({
        where: { employeeId: employee.id, status: 'Active' },
      });
      if (existing) continue;
      await this.structures.save(
        this.structures.create({
          employeeId: employee.id,
          salaryType: 'Monthly_Fixed',
          monthlyBase: seed.monthlyBase,
          dailyRate: Math.round(seed.monthlyBase / 26),
          productionRatePerCard: 0,
          teaAllowanceDaily: 60,
          otRatePerHour: 400,
          attendanceBonusAmount: 2_500,
          effectiveFromDate: new Date('2024-01-01'),
          effectiveToDate: null,
          status: 'Active',
          notes: 'Seeded demo salary structure',
          createdBy: adminId,
        }),
      );
    }
  }

  // ── Attendance ──────────────────────────────────────────

  /**
   * 21 working days (last 30 calendar days, excluding weekends) per
   * employee. Most rows are Present 09:00-18:00; every 7th row is a
   * Half_Day to make pro-ration visible in payroll preview.
   */
  private async ensureAttendance(
    employees: Employee[],
    adminId: string,
  ): Promise<void> {
    const existingCount = await this.attendance.count();
    if (existingCount > 0) return;

    const today = new Date();
    const dates: Date[] = [];
    for (let i = 1; i <= 30; i += 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const day = d.getDay();
      if (day === 0 || day === 6) continue;
      dates.push(d);
      if (dates.length >= 21) break;
    }

    for (const employee of employees) {
      const rows = dates.map((date, idx) => {
        const isHalfDay = idx % 7 === 6;
        const isLate = idx % 5 === 0;
        return this.attendance.create({
          employeeId: employee.id,
          attendanceDate: date,
          checkInTime: isLate ? '09:25:00' : '09:00:00',
          checkOutTime: isHalfDay ? '13:00:00' : '18:00:00',
          totalHours: isHalfDay ? 4 : 8,
          status: isHalfDay ? 'Half_Day' : 'Present',
          isLate,
          lateMinutes: isLate ? 25 : 0,
          isOvertime: false,
          overtimeHours: 0,
          markedBy: 'Manual',
          cardsProduced: 0,
          notes: null,
          createdBy: adminId,
        });
      });
      await this.attendance.save(rows);
    }
  }

  // ── Leaves ──────────────────────────────────────────────

  private async ensureLeaves(
    employees: Employee[],
    ctx: HrSeedContext,
  ): Promise<void> {
    const existingCount = await this.leaves.count();
    if (existingCount > 0) return;

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekEnd = new Date(nextWeek);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 1);

    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 20);
    const lastMonthEnd = new Date(lastMonth);
    lastMonthEnd.setDate(lastMonthEnd.getDate() + 2);

    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const drafts: Partial<EmployeeLeave>[] = [];
    // Pending leave from each cashier — drives the manager approve UI
    for (const emp of employees.filter(
      (e) => e.role === 'Cashier' || e.role === 'Stock Clerk',
    )) {
      drafts.push({
        employeeId: emp.id,
        leaveType: 'Annual',
        startDate: nextWeek,
        endDate: nextWeekEnd,
        totalDays: 2,
        reason: 'Family event',
        status: 'Pending',
        appliedDate: today,
      });
    }
    // One previously-approved Annual leave per manager (so balances
    // already reflect approved deductions)
    for (const emp of employees.filter((e) => e.role === 'Branch Manager')) {
      drafts.push({
        employeeId: emp.id,
        leaveType: 'Annual',
        startDate: lastMonth,
        endDate: lastMonthEnd,
        totalDays: 3,
        reason: 'Approved annual leave',
        status: 'Approved',
        appliedDate: twoWeeksAgo,
        approvedBy: ctx.admin.id,
        approvedDate: twoWeeksAgo,
      });
    }
    // One rejected sick leave for variety
    if (employees[2]) {
      drafts.push({
        employeeId: employees[2].id,
        leaveType: 'Sick',
        startDate: twoWeeksAgo,
        endDate: twoWeeksAgo,
        totalDays: 1,
        reason: 'Sick leave',
        status: 'Rejected',
        appliedDate: twoWeeksAgo,
        approvedBy: ctx.admin.id,
        approvedDate: twoWeeksAgo,
        rejectionReason: 'No medical certificate attached',
      });
    }

    await this.leaves.save(drafts.map((d) => this.leaves.create(d)));
  }

  // ── Payroll (previous month) ─────────────────────────────

  /**
   * Pre-runs payroll for the previous calendar month so the new UI
   * has rows to display, approve, and mark paid without the demo
   * user having to click "Generate" first.
   */
  private async ensurePreviousPayroll(
    employees: Employee[],
    adminId: string,
  ): Promise<void> {
    const existingCount = await this.payrolls.count();
    if (existingCount > 0) return;

    const today = new Date();
    const prevMonthDate = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    const month = prevMonthDate.getMonth() + 1;
    const year = prevMonthDate.getFullYear();

    const drafts = employees.map((emp) => {
      const structure = this.estimateStructureFor(emp);
      const basic = structure.monthlyBase;
      const tea = structure.teaAllowanceDaily * 21;
      const gross = basic + tea;
      const epfEmployee = Math.round(basic * (SL_EPF_EMPLOYEE / 100));
      const epfEmployer = Math.round(basic * (SL_EPF_EMPLOYER / 100));
      const etfEmployer = Math.round(basic * (SL_ETF_EMPLOYER / 100));
      const deductions = epfEmployee;
      const net = gross - deductions;
      return this.payrolls.create({
        employeeId: emp.id,
        payPeriodMonth: month,
        payPeriodYear: year,
        basicSalary: basic,
        productionEarnings: 0,
        overtimeEarnings: 0,
        attendanceBonus: 0,
        teaAllowance: tea,
        otherAllowances: 0,
        grossSalary: gross,
        epfEmployeeDeduction: epfEmployee,
        etfEmployeeDeduction: 0,
        advanceDeduction: 0,
        otherDeductions: 0,
        totalDeductions: deductions,
        netSalary: net,
        epfEmployerContribution: epfEmployer,
        etfEmployerContribution: etfEmployer,
        paymentStatus: 'Approved',
        paymentDate: null,
        paymentMethod: 'Bank_Transfer',
        bankReferenceNo: null,
        paySlipGenerated: false,
        paySlipUrl: null,
        notes: 'Seeded demo payroll run — previous period',
        generatedBy: adminId,
        approvedBy: adminId,
      });
    });
    await this.payrolls.save(drafts);
  }

  /**
   * Lightweight per-role fallback so the previous-month payroll seed
   * does not need to round-trip the salary_structures table again.
   */
  private estimateStructureFor(employee: Employee): {
    monthlyBase: number;
    teaAllowanceDaily: number;
  } {
    if (employee.role === 'Branch Manager') {
      return { monthlyBase: 92_000, teaAllowanceDaily: 60 };
    }
    if (employee.role === 'Cashier') {
      return { monthlyBase: 44_000, teaAllowanceDaily: 60 };
    }
    return { monthlyBase: 36_000, teaAllowanceDaily: 60 };
  }
}
