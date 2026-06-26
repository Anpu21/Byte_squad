/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { PayrollService, type PayrollActor } from './payroll.service';
import { PayrollRepository } from './payroll.repository';
import { EmployeesRepository } from './employees.repository';
import { AttendanceRepository } from './attendance.repository';
import { SalaryStructuresRepository } from './salary-structures.repository';
import { PayrollSettingsService } from './payroll-settings.service';
import { Attendance } from './entities/attendance.entity';
import { Employee } from './entities/employee.entity';
import { Payroll } from './entities/payroll.entity';
import { PayrollSettings } from './entities/payroll-settings.entity';
import { SalaryStructure } from './entities/salary-structure.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const EMP_A_ID = '33333333-3333-3333-3333-333333333333';
const EMP_B_ID = '44444444-4444-4444-4444-444444444444';
const ADMIN_ID = 'admin-1';
const MANAGER_ID = 'manager-1';
const PAYROLL_ID = '55555555-5555-5555-5555-555555555555';

const ADMIN_ACTOR: PayrollActor = {
  id: ADMIN_ID,
  role: UserRole.ADMIN,
  branchId: null,
};
const MANAGER_ACTOR: PayrollActor = {
  id: MANAGER_ID,
  role: UserRole.MANAGER,
  branchId: BRANCH_A,
};

function makeEmployee(over: Partial<Employee> = {}): Employee {
  return {
    id: EMP_A_ID,
    employeeCode: 'EMP001',
    branchId: BRANCH_A,
    fullName: 'Jane Doe',
    contactPhone: '+94771234567',
    hireDate: new Date('2024-01-15'),
    employeeType: 'Permanent',
    role: 'Cashier',
    workingHoursStart: '08:00:00',
    workingHoursEnd: '16:00:00',
    epfEligible: true,
    etfEligible: true,
    bankName: 'Sampath',
    bankBranch: 'Colombo Main',
    bankAccountNo: '1234567890',
    bankAccountName: 'Jane Doe',
    status: 'Active',
    annualLeaveBalance: 14,
    ...over,
  } as Employee;
}

function makeStructure(over: Partial<SalaryStructure> = {}): SalaryStructure {
  return {
    id: 'struct-1',
    employeeId: EMP_A_ID,
    salaryType: 'Monthly_Fixed',
    monthlyBase: 100000,
    dailyRate: 0,
    productionRatePerCard: 0,
    teaAllowanceDaily: 60,
    otRatePerHour: 400,
    attendanceBonusAmount: 5000,
    effectiveFromDate: new Date('2026-01-01'),
    effectiveToDate: null,
    status: 'Active',
    notes: null,
    createdBy: ADMIN_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as SalaryStructure;
}

function makeSettings(over: Partial<PayrollSettings> = {}): PayrollSettings {
  return {
    id: 'settings-1',
    branchId: null,
    epfEmployeePercent: 8,
    epfEmployerPercent: 12,
    etfEmployerPercent: 3,
    attendanceBonusThreshold: 26,
    lateGraceMinutes: 15,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as PayrollSettings;
}

function makeAttendance(over: Partial<Attendance> = {}): Attendance {
  return {
    id: 'att-1',
    employeeId: EMP_A_ID,
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
    createdBy: ADMIN_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Attendance;
}

function makePayroll(over: Partial<Payroll> = {}): Payroll {
  return {
    id: PAYROLL_ID,
    employeeId: EMP_A_ID,
    payPeriodMonth: 5,
    payPeriodYear: 2026,
    basicSalary: 100000,
    productionEarnings: 0,
    overtimeEarnings: 0,
    attendanceBonus: 5000,
    teaAllowance: 1560,
    otherAllowances: 0,
    grossSalary: 106560,
    epfEmployeeDeduction: 8524.8,
    etfEmployeeDeduction: 0,
    advanceDeduction: 0,
    otherDeductions: 0,
    totalDeductions: 8524.8,
    netSalary: 98035.2,
    epfEmployerContribution: 12787.2,
    etfEmployerContribution: 3196.8,
    paymentStatus: 'Pending',
    paymentDate: null,
    paymentMethod: 'Card',
    paymentReference: null,
    paySlipGenerated: false,
    paySlipUrl: null,
    notes: null,
    otherDeductionsReason: null,
    otherAllowancesReason: null,
    generatedBy: ADMIN_ID,
    approvedBy: null,
    generatedAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Payroll;
}

describe('PayrollService', () => {
  let service: PayrollService;
  let payrollRepo: jest.Mocked<PayrollRepository>;
  let employeesRepo: jest.Mocked<EmployeesRepository>;
  let attendanceRepo: jest.Mocked<AttendanceRepository>;
  let structuresRepo: jest.Mocked<SalaryStructuresRepository>;
  let settingsService: jest.Mocked<PayrollSettingsService>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb({} as unknown)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: PayrollRepository,
          useValue: {
            findById: jest.fn(),
            findExisting: jest.fn(),
            listForBranch: jest.fn(),
            upsert: jest.fn(),
            updatePartial: jest.fn(),
          },
        },
        {
          provide: EmployeesRepository,
          useValue: {
            findById: jest.fn(),
            listForBranch: jest.fn(),
          },
        },
        {
          provide: AttendanceRepository,
          useValue: {
            listForBranch: jest.fn(),
          },
        },
        {
          provide: SalaryStructuresRepository,
          useValue: {
            findActiveOn: jest.fn(),
          },
        },
        {
          provide: PayrollSettingsService,
          useValue: {
            getEffective: jest.fn(),
          },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(PayrollService);
    payrollRepo = moduleRef.get(PayrollRepository);
    employeesRepo = moduleRef.get(EmployeesRepository);
    attendanceRepo = moduleRef.get(AttendanceRepository);
    structuresRepo = moduleRef.get(SalaryStructuresRepository);
    settingsService = moduleRef.get(PayrollSettingsService);
  });

  describe('list', () => {
    it('manager is pinned to own branch regardless of query.branchId', async () => {
      payrollRepo.listForBranch.mockResolvedValue({
        rows: [makePayroll()],
        total: 1,
      });
      await service.list({ branchId: BRANCH_B }, MANAGER_ACTOR);
      expect(payrollRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A }),
      );
    });

    it('admin can span all branches when branchId omitted', async () => {
      payrollRepo.listForBranch.mockResolvedValue({ rows: [], total: 0 });
      await service.list({}, ADMIN_ACTOR);
      expect(payrollRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: undefined }),
      );
    });
  });

  describe('getById', () => {
    it('404 when missing', async () => {
      payrollRepo.findById.mockResolvedValue(null);
      await expect(
        service.getById(PAYROLL_ID, ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('403 when manager tries to load cross-branch payroll', async () => {
      payrollRepo.findById.mockResolvedValue(makePayroll());
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ branchId: BRANCH_B }),
      );
      await expect(
        service.getById(PAYROLL_ID, MANAGER_ACTOR),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('generate', () => {
    const baseArgs = { month: 5, year: 2026 };

    function arrangeGenerator(
      opts: {
        employees?: Employee[];
        structures?: Map<string, SalaryStructure | null>;
        attendance?: Attendance[];
        existing?: Payroll | null;
      } = {},
    ) {
      const employees = opts.employees ?? [makeEmployee()];
      const structures =
        opts.structures ??
        new Map([[EMP_A_ID, makeStructure() as SalaryStructure | null]]);
      const attendance = opts.attendance ?? [];
      settingsService.getEffective.mockResolvedValue(makeSettings());
      employeesRepo.listForBranch.mockResolvedValue({
        rows: employees,
        total: employees.length,
      });
      structuresRepo.findActiveOn.mockImplementation((employeeId) =>
        Promise.resolve(structures.get(employeeId) ?? null),
      );
      attendanceRepo.listForBranch.mockResolvedValue(attendance);
      payrollRepo.findExisting.mockResolvedValue(opts.existing ?? null);
      payrollRepo.upsert.mockImplementation((input) =>
        Promise.resolve(makePayroll(input as Partial<Payroll>)),
      );
    }

    it('Monthly_Fixed full month: persists basic + tea + bonus + OT', async () => {
      const attendance = Array.from({ length: 26 }, (_, i) =>
        makeAttendance({
          attendanceDate: new Date(Date.UTC(2026, 4, i + 1)),
        }),
      );
      arrangeGenerator({ attendance });

      const out = await service.generate(baseArgs, ADMIN_ACTOR);
      expect(out.rows).toHaveLength(1);
      expect(out.skipped).toHaveLength(0);
      expect(payrollRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: EMP_A_ID,
          payPeriodMonth: 5,
          payPeriodYear: 2026,
          basicSalary: 100000,
          teaAllowance: 1560,
          attendanceBonus: 5000,
          paymentStatus: 'Pending',
        }),
        expect.anything(),
      );
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('Production_Based: productionEarnings = cards * rate', async () => {
      arrangeGenerator({
        structures: new Map([
          [
            EMP_A_ID,
            makeStructure({
              salaryType: 'Production_Based',
              monthlyBase: 0,
              productionRatePerCard: 150,
              attendanceBonusAmount: 0,
            }),
          ],
        ]),
        attendance: [
          makeAttendance({ cardsProduced: 60 }),
          makeAttendance({ cardsProduced: 60 }),
        ],
      });

      await service.generate(baseArgs, ADMIN_ACTOR);
      expect(payrollRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          basicSalary: 0,
          productionEarnings: 120 * 150,
        }),
        expect.anything(),
      );
    });

    it('skips employees without an Active SalaryStructure with a warning', async () => {
      const empB = makeEmployee({ id: EMP_B_ID, employeeCode: 'EMP002' });
      arrangeGenerator({
        employees: [makeEmployee(), empB],
        structures: new Map([
          [EMP_A_ID, makeStructure() as SalaryStructure | null],
          [EMP_B_ID, null],
        ]),
      });

      const out = await service.generate(baseArgs, ADMIN_ACTOR);
      expect(out.rows).toHaveLength(1);
      expect(out.skipped).toHaveLength(1);
      expect(out.skipped[0].employeeId).toBe(EMP_B_ID);
      expect(out.skipped[0].reason).toContain('No active salary structure');
    });

    it('overwrites an existing Pending payroll on re-run', async () => {
      const existing = makePayroll({ basicSalary: 50000 });
      arrangeGenerator({ existing });
      await service.generate(baseArgs, ADMIN_ACTOR);
      // The upsert call carried the existing id so the row is updated
      // rather than duplicated.
      expect(payrollRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id: PAYROLL_ID }),
        expect.anything(),
      );
    });

    it('refuses to overwrite an Approved payroll (409)', async () => {
      arrangeGenerator({
        existing: makePayroll({ paymentStatus: 'Approved' }),
      });
      await expect(
        service.generate(baseArgs, ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(payrollRepo.upsert).not.toHaveBeenCalled();
    });

    it('manager is pinned to own branch regardless of branchId', async () => {
      arrangeGenerator();
      await service.generate(
        { ...baseArgs, branchId: BRANCH_B },
        MANAGER_ACTOR,
      );
      expect(employeesRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A }),
      );
    });
  });

  describe('approve', () => {
    it('Pending → Approved stamps approvedBy', async () => {
      payrollRepo.findById.mockResolvedValue(makePayroll());
      payrollRepo.updatePartial.mockResolvedValue(
        makePayroll({ paymentStatus: 'Approved', approvedBy: ADMIN_ID }),
      );
      const out = await service.approve(PAYROLL_ID, ADMIN_ACTOR);
      expect(out.paymentStatus).toBe('Approved');
      expect(payrollRepo.updatePartial).toHaveBeenCalledWith(
        PAYROLL_ID,
        expect.objectContaining({
          paymentStatus: 'Approved',
          approvedBy: ADMIN_ID,
        }),
      );
    });

    it('non-Pending → 409', async () => {
      payrollRepo.findById.mockResolvedValue(
        makePayroll({ paymentStatus: 'Approved' }),
      );
      await expect(
        service.approve(PAYROLL_ID, ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('markPaid', () => {
    const dto = {
      paymentDate: '2026-06-05',
      paymentMethod: 'Card' as const,
      paymentReference: 'TRX-001',
    };

    it('Approved → Paid stamps payment fields', async () => {
      payrollRepo.findById.mockResolvedValue(
        makePayroll({ paymentStatus: 'Approved' }),
      );
      payrollRepo.updatePartial.mockResolvedValue(
        makePayroll({
          paymentStatus: 'Paid',
          paymentDate: new Date('2026-06-05'),
          paymentMethod: 'Card',
          paymentReference: 'TRX-001',
        }),
      );
      const out = await service.markPaid(PAYROLL_ID, dto, ADMIN_ACTOR);
      expect(out.paymentStatus).toBe('Paid');
      expect(payrollRepo.updatePartial).toHaveBeenCalledWith(
        PAYROLL_ID,
        expect.objectContaining({
          paymentStatus: 'Paid',
          paymentMethod: 'Card',
          paymentReference: 'TRX-001',
        }),
      );
    });

    it('non-Approved → 409', async () => {
      payrollRepo.findById.mockResolvedValue(
        makePayroll({ paymentStatus: 'Pending' }),
      );
      await expect(
        service.markPaid(PAYROLL_ID, dto, ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('cancel', () => {
    it('Pending → Cancelled', async () => {
      payrollRepo.findById.mockResolvedValue(makePayroll());
      payrollRepo.updatePartial.mockResolvedValue(
        makePayroll({ paymentStatus: 'Cancelled' }),
      );
      const out = await service.cancel(PAYROLL_ID, ADMIN_ACTOR);
      expect(out.paymentStatus).toBe('Cancelled');
    });

    it('Paid → 409 (already disbursed)', async () => {
      payrollRepo.findById.mockResolvedValue(
        makePayroll({ paymentStatus: 'Paid' }),
      );
      await expect(
        service.cancel(PAYROLL_ID, ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('exportCsv', () => {
    it('returns header + one row per Approved/Paid', async () => {
      payrollRepo.listForBranch.mockResolvedValue({
        rows: [makePayroll({ paymentStatus: 'Approved', netSalary: 92000 })],
        total: 1,
      });
      employeesRepo.findById.mockResolvedValue(makeEmployee());

      const csv = await service.exportCsv(
        { month: 5, year: 2026 },
        ADMIN_ACTOR,
      );
      expect(csv).toContain(
        'employee_code,employee_name,pay_period,gross_salary,net_salary,payment_method,payment_status,payment_date',
      );
      expect(csv).toContain(
        'EMP001,Jane Doe,2026-05,106560,92000,Card,Approved,',
      );
      // listForBranch invoked once with the IN([Approved, Paid]) filter.
      expect(payrollRepo.listForBranch).toHaveBeenCalledTimes(1);
      expect(payrollRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ status: ['Approved', 'Paid'] }),
      );
    });

    it('returns header-only when no Approved/Paid rows exist', async () => {
      payrollRepo.listForBranch.mockResolvedValue({ rows: [], total: 0 });
      const csv = await service.exportCsv(
        { month: 5, year: 2026 },
        ADMIN_ACTOR,
      );
      expect(csv.split('\n').filter(Boolean)).toHaveLength(1);
    });
  });
});
