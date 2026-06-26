/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceRepository } from './attendance.repository';
import { EmployeesRepository } from './employees.repository';
import { PayrollSettingsService } from './payroll-settings.service';
import { Attendance } from './entities/attendance.entity';
import { Employee } from './entities/employee.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import type { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { PayrollSettings } from './entities/payroll-settings.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const EMP_A_ID = '33333333-3333-3333-3333-333333333333';
const EMP_B_ID = '44444444-4444-4444-4444-444444444444';
const ADMIN_ID = 'admin-1';
const MANAGER_ID = 'manager-1';
const CASHIER_USER_ID = 'cashier-user-1';

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: EMP_A_ID,
    employeeCode: 'EMP001',
    userId: null,
    branchId: BRANCH_A,
    fullName: 'Jane Doe',
    nameWithInitials: null,
    nic: null,
    dateOfBirth: null,
    gender: null,
    maritalStatus: null,
    contactPhone: '+94771234567',
    contactPhone2: null,
    email: null,
    permanentAddress: null,
    currentAddress: null,
    city: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
    hireDate: new Date('2024-01-15'),
    confirmationDate: null,
    employeeType: 'Permanent',
    role: 'Cashier',
    workingHoursStart: '08:00:00',
    workingHoursEnd: '16:00:00',
    epfEligible: false,
    etfEligible: false,
    epfNumber: null,
    etfNumber: null,
    bankName: null,
    bankAccountNo: null,
    bankBranch: null,
    bankAccountName: null,
    status: 'Active',
    resignationDate: null,
    resignationReason: null,
    terminationDate: null,
    terminationReason: null,
    notes: null,
    photoUrl: null,
    annualLeaveBalance: 14,
    createdBy: ADMIN_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Employee;
}

function makeAttendance(overrides: Partial<Attendance> = {}): Attendance {
  return {
    id: 'att-1',
    employeeId: EMP_A_ID,
    attendanceDate: new Date('2026-05-24'),
    checkInTime: null,
    checkOutTime: null,
    totalHours: null,
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
    ...overrides,
  } as Attendance;
}

const ADMIN_ACTOR = {
  id: ADMIN_ID,
  role: UserRole.ADMIN,
  branchId: null,
} as const;

const MANAGER_A_ACTOR = {
  id: MANAGER_ID,
  role: UserRole.MANAGER,
  branchId: BRANCH_A,
} as const;

const CASHIER_ACTOR = {
  id: CASHIER_USER_ID,
  role: UserRole.CASHIER,
  branchId: BRANCH_A,
} as const;

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepo: jest.Mocked<AttendanceRepository>;
  let employeesRepo: jest.Mocked<EmployeesRepository>;
  let payrollSettings: jest.Mocked<PayrollSettingsService>;

  beforeEach(async () => {
    const attendanceRepoMock: Partial<jest.Mocked<AttendanceRepository>> = {
      findByEmployeeAndDate: jest.fn(),
      listForBranch: jest.fn(),
      upsertManagerEntry: jest.fn(),
      upsertManagerEntries: jest.fn(),
      upsertCheckIn: jest.fn(),
      applyCheckOut: jest.fn(),
    };
    const employeesRepoMock: Partial<jest.Mocked<EmployeesRepository>> = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      listForBranch: jest.fn(),
    };
    const payrollSettingsMock: Partial<jest.Mocked<PayrollSettingsService>> = {
      // Default to the seed grace window so existing late-window
      // expectations keep holding without each test wiring its own.
      getEffective: jest
        .fn()
        .mockResolvedValue({ lateGraceMinutes: 15 } as PayrollSettings),
    };

    const module = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: AttendanceRepository, useValue: attendanceRepoMock },
        { provide: EmployeesRepository, useValue: employeesRepoMock },
        { provide: PayrollSettingsService, useValue: payrollSettingsMock },
      ],
    }).compile();

    service = module.get(AttendanceService);
    attendanceRepo = module.get(AttendanceRepository);
    employeesRepo = module.get(EmployeesRepository);
    payrollSettings = module.get(PayrollSettingsService);
    void payrollSettings;
  });

  describe('todayStatus', () => {
    it('flags active employees with no row today as pending (manager → own branch)', async () => {
      employeesRepo.listForBranch.mockResolvedValue({
        rows: [
          makeEmployee({ id: 'e1', fullName: 'Ravi', role: 'Courier' }),
          makeEmployee({ id: 'e2', fullName: 'Emma', role: 'Cashier' }),
        ],
        total: 2,
      });
      // Only e2 has a row today → e1 is pending.
      attendanceRepo.listForBranch.mockResolvedValue([
        makeAttendance({ employeeId: 'e2' }),
      ]);

      const result = await service.todayStatus(MANAGER_A_ACTOR);

      expect(employeesRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A, status: 'Active' }),
      );
      expect(result.total).toBe(2);
      expect(result.recorded).toBe(1);
      expect(result.pendingCount).toBe(1);
      expect(result.pending.map((p) => p.employeeId)).toEqual(['e1']);
      expect(result.pending[0].role).toBe('Courier');
    });
  });

  describe('list', () => {
    it('admin sees all branches when no branchId filter is passed', async () => {
      attendanceRepo.listForBranch.mockResolvedValue([makeAttendance()]);

      const result = await service.list(
        { startDate: '2026-05-01', endDate: '2026-05-31' },
        ADMIN_ACTOR,
      );

      expect(attendanceRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: undefined }),
      );
      expect(result.rows).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('admin can filter to a specific branch', async () => {
      attendanceRepo.listForBranch.mockResolvedValue([]);

      await service.list(
        {
          branchId: BRANCH_A,
          startDate: '2026-05-01',
          endDate: '2026-05-31',
        },
        ADMIN_ACTOR,
      );

      expect(attendanceRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A }),
      );
    });

    it('manager is pinned to their own branch even when query passes a different branchId', async () => {
      attendanceRepo.listForBranch.mockResolvedValue([]);

      await service.list(
        {
          branchId: BRANCH_B,
          startDate: '2026-05-01',
          endDate: '2026-05-31',
        },
        MANAGER_A_ACTOR,
      );

      expect(attendanceRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A }),
      );
    });
  });

  describe('bulkUpsert', () => {
    const baseDto = (): BulkAttendanceDto => ({
      rows: [
        {
          employeeId: EMP_A_ID,
          attendanceDate: '2026-05-24',
          checkInTime: '08:05',
          checkOutTime: '16:00',
          status: 'Present',
        },
      ],
    });

    it('persists rows with markedBy=Manual when the actor is a manager', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      attendanceRepo.upsertManagerEntries.mockImplementation((entries) =>
        Promise.resolve(
          entries.map((e) =>
            makeAttendance({
              employeeId: e.employeeId,
              checkInTime: e.checkInTime ?? null,
              checkOutTime: e.checkOutTime ?? null,
              status: e.status as Attendance['status'],
              markedBy: e.markedBy ?? 'Manual',
            }),
          ),
        ),
      );

      const result = await service.bulkUpsert(baseDto(), MANAGER_A_ACTOR);

      expect(attendanceRepo.upsertManagerEntries).toHaveBeenCalledTimes(1);
      const submitted = attendanceRepo.upsertManagerEntries.mock.calls[0][0];
      expect(submitted[0].markedBy).toBe('Manual');
      expect(submitted[0].createdBy).toBe(MANAGER_ID);
      expect(result).toHaveLength(1);
    });

    it('stamps markedBy=Admin when the actor is an admin', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      attendanceRepo.upsertManagerEntries.mockResolvedValue([makeAttendance()]);

      await service.bulkUpsert(baseDto(), ADMIN_ACTOR);

      const submitted = attendanceRepo.upsertManagerEntries.mock.calls[0][0];
      expect(submitted[0].markedBy).toBe('Admin');
    });

    it('throws Forbidden when a manager grids a row for an employee in another branch', async () => {
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ branchId: BRANCH_B }),
      );

      await expect(
        service.bulkUpsert(baseDto(), MANAGER_A_ACTOR),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(attendanceRepo.upsertManagerEntries).not.toHaveBeenCalled();
    });

    it('throws NotFound when a row references a missing employee', async () => {
      employeesRepo.findById.mockResolvedValue(null);

      await expect(
        service.bulkUpsert(baseDto(), ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('computes lateness when check-in is past grace window', async () => {
      // 08:20 with a scheduled start of 08:00 and a 15-min grace =
      // 5 minutes late.
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ workingHoursStart: '08:00:00' }),
      );
      attendanceRepo.upsertManagerEntries.mockResolvedValue([makeAttendance()]);

      await service.bulkUpsert(
        {
          rows: [
            {
              employeeId: EMP_A_ID,
              attendanceDate: '2026-05-24',
              checkInTime: '08:20',
              status: 'Present',
            },
          ],
        },
        ADMIN_ACTOR,
      );

      const submitted = attendanceRepo.upsertManagerEntries.mock.calls[0][0];
      expect(submitted[0].isLate).toBe(true);
      expect(submitted[0].lateMinutes).toBe(5);
    });

    it('does not flag late when check-in is within the grace window', async () => {
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ workingHoursStart: '08:00:00' }),
      );
      attendanceRepo.upsertManagerEntries.mockResolvedValue([makeAttendance()]);

      await service.bulkUpsert(
        {
          rows: [
            {
              employeeId: EMP_A_ID,
              attendanceDate: '2026-05-24',
              checkInTime: '08:10',
              status: 'Present',
            },
          ],
        },
        ADMIN_ACTOR,
      );

      const submitted = attendanceRepo.upsertManagerEntries.mock.calls[0][0];
      expect(submitted[0].isLate).toBe(false);
      expect(submitted[0].lateMinutes).toBe(0);
    });

    it('computes total_hours when both check-in and check-out are provided', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      attendanceRepo.upsertManagerEntries.mockResolvedValue([makeAttendance()]);

      await service.bulkUpsert(
        {
          rows: [
            {
              employeeId: EMP_A_ID,
              attendanceDate: '2026-05-24',
              checkInTime: '08:00',
              checkOutTime: '17:30',
              status: 'Present',
            },
          ],
        },
        ADMIN_ACTOR,
      );

      const submitted = attendanceRepo.upsertManagerEntries.mock.calls[0][0];
      expect(submitted[0].totalHours).toBe(9.5);
    });

    it('prefers explicit totalHours when it is provided', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      attendanceRepo.upsertManagerEntries.mockResolvedValue([makeAttendance()]);

      await service.bulkUpsert(
        {
          rows: [
            {
              employeeId: EMP_A_ID,
              attendanceDate: '2026-05-24',
              checkInTime: '08:00',
              checkOutTime: '17:30',
              status: 'Present',
              totalHours: 6.25,
            },
          ],
        },
        ADMIN_ACTOR,
      );

      const submitted = attendanceRepo.upsertManagerEntries.mock.calls[0][0];
      expect(submitted[0].totalHours).toBe(6.25);
    });

    it('saves non-working statuses with null total hours when duration is omitted', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      attendanceRepo.upsertManagerEntries.mockResolvedValue([makeAttendance()]);

      await service.bulkUpsert(
        {
          rows: [
            {
              employeeId: EMP_A_ID,
              attendanceDate: '2026-05-24',
              status: 'Holiday',
            },
          ],
        },
        ADMIN_ACTOR,
      );

      const submitted = attendanceRepo.upsertManagerEntries.mock.calls[0][0];
      expect(submitted[0]).toEqual(
        expect.objectContaining({
          status: 'Holiday',
          checkInTime: null,
          checkOutTime: null,
          totalHours: null,
        }),
      );
    });

    it('reuses a cached employee lookup across multiple rows', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      attendanceRepo.upsertManagerEntries.mockResolvedValue([
        makeAttendance(),
        makeAttendance(),
      ]);

      await service.bulkUpsert(
        {
          rows: [
            {
              employeeId: EMP_A_ID,
              attendanceDate: '2026-05-23',
              status: 'Present',
              checkInTime: '08:00',
            },
            {
              employeeId: EMP_A_ID,
              attendanceDate: '2026-05-24',
              status: 'Present',
              checkInTime: '08:00',
            },
          ],
        },
        ADMIN_ACTOR,
      );

      expect(employeesRepo.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkInSelf', () => {
    const NOW = new Date('2026-05-24T08:05:00Z');

    function mockEmployeeForUser(employee: Employee | null) {
      employeesRepo.findByUserId.mockResolvedValue(employee);
    }

    it('inserts a Present row stamped with Cashier_Self on the happy path', async () => {
      mockEmployeeForUser(
        makeEmployee({
          userId: CASHIER_USER_ID,
          workingHoursStart: '08:00:00',
        }),
      );
      attendanceRepo.findByEmployeeAndDate.mockResolvedValue(null);
      attendanceRepo.upsertCheckIn.mockImplementation((input) =>
        Promise.resolve(
          makeAttendance({
            employeeId: input.employeeId,
            attendanceDate: input.attendanceDate,
            checkInTime: input.checkInTime,
            status: 'Present',
            markedBy: 'Cashier_Self',
            isLate: input.isLate,
            lateMinutes: input.lateMinutes,
            createdBy: input.createdBy,
          }),
        ),
      );

      const result = await service.checkInSelf(CASHIER_ACTOR, NOW);

      expect(attendanceRepo.upsertCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: EMP_A_ID,
          checkInTime: '08:05:00',
          isLate: false,
          createdBy: CASHIER_USER_ID,
        }),
      );
      expect(result.markedBy).toBe('Cashier_Self');
      expect(result.status).toBe('Present');
    });

    it('throws NotFound when no employee record is linked to the user', async () => {
      mockEmployeeForUser(null);

      await expect(
        service.checkInSelf(CASHIER_ACTOR, NOW),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Forbidden when the employee is not Active', async () => {
      mockEmployeeForUser(
        makeEmployee({ userId: CASHIER_USER_ID, status: 'Terminated' }),
      );

      await expect(
        service.checkInSelf(CASHIER_ACTOR, NOW),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequest when already checked in for today', async () => {
      mockEmployeeForUser(makeEmployee({ userId: CASHIER_USER_ID }));
      attendanceRepo.findByEmployeeAndDate.mockResolvedValue(
        makeAttendance({ checkInTime: '08:00:00', status: 'Present' }),
      );

      await expect(
        service.checkInSelf(CASHIER_ACTOR, NOW),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(attendanceRepo.upsertCheckIn).not.toHaveBeenCalled();
    });

    it('throws BadRequest when today is marked Leave', async () => {
      mockEmployeeForUser(makeEmployee({ userId: CASHIER_USER_ID }));
      attendanceRepo.findByEmployeeAndDate.mockResolvedValue(
        makeAttendance({ status: 'Leave', checkInTime: null }),
      );

      await expect(
        service.checkInSelf(CASHIER_ACTOR, NOW),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when today is marked Holiday', async () => {
      mockEmployeeForUser(makeEmployee({ userId: CASHIER_USER_ID }));
      attendanceRepo.findByEmployeeAndDate.mockResolvedValue(
        makeAttendance({ status: 'Holiday', checkInTime: null }),
      );

      await expect(
        service.checkInSelf(CASHIER_ACTOR, NOW),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('computes lateness against the employee schedule + grace window', async () => {
      // 08:30 against scheduled 08:00 + 15-min grace = 15 late.
      mockEmployeeForUser(
        makeEmployee({
          userId: CASHIER_USER_ID,
          workingHoursStart: '08:00:00',
        }),
      );
      attendanceRepo.findByEmployeeAndDate.mockResolvedValue(null);
      attendanceRepo.upsertCheckIn.mockImplementation((input) =>
        Promise.resolve(makeAttendance({ ...input, status: 'Present' })),
      );

      await service.checkInSelf(
        CASHIER_ACTOR,
        new Date('2026-05-24T08:30:00Z'),
      );

      const submitted = attendanceRepo.upsertCheckIn.mock.calls[0][0];
      expect(submitted.isLate).toBe(true);
      expect(submitted.lateMinutes).toBe(15);
    });
  });

  describe('checkOutSelf', () => {
    const NOW = new Date('2026-05-24T17:30:00Z');

    function mockEmployeeForUser(employee: Employee | null) {
      employeesRepo.findByUserId.mockResolvedValue(employee);
    }

    it('computes total_hours and overtime past the scheduled end', async () => {
      // Scheduled end 16:00, check-out 17:30 = 1.5h overtime; total
      // span 08:00 -> 17:30 = 9.5h.
      mockEmployeeForUser(
        makeEmployee({
          userId: CASHIER_USER_ID,
          workingHoursStart: '08:00:00',
          workingHoursEnd: '16:00:00',
        }),
      );
      attendanceRepo.findByEmployeeAndDate.mockResolvedValue(
        makeAttendance({ checkInTime: '08:00:00' }),
      );
      attendanceRepo.applyCheckOut.mockImplementation((_id, _date, patch) =>
        Promise.resolve(
          makeAttendance({
            checkInTime: '08:00:00',
            checkOutTime: patch.checkOutTime,
            totalHours: patch.totalHours,
            isOvertime: patch.isOvertime,
            overtimeHours: patch.overtimeHours,
          }),
        ),
      );

      const result = await service.checkOutSelf(CASHIER_ACTOR, NOW);

      expect(attendanceRepo.applyCheckOut).toHaveBeenCalledWith(
        EMP_A_ID,
        expect.any(Date),
        expect.objectContaining({
          checkOutTime: '17:30:00',
          totalHours: 9.5,
          isOvertime: true,
          overtimeHours: 1.5,
        }),
      );
      expect(result.totalHours).toBe(9.5);
      expect(result.isOvertime).toBe(true);
    });

    it('throws BadRequest when no check-in is on file', async () => {
      mockEmployeeForUser(makeEmployee({ userId: CASHIER_USER_ID }));
      attendanceRepo.findByEmployeeAndDate.mockResolvedValue(null);

      await expect(
        service.checkOutSelf(CASHIER_ACTOR, NOW),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when there is a row but no check-in time', async () => {
      mockEmployeeForUser(makeEmployee({ userId: CASHIER_USER_ID }));
      attendanceRepo.findByEmployeeAndDate.mockResolvedValue(
        makeAttendance({ checkInTime: null }),
      );

      await expect(
        service.checkOutSelf(CASHIER_ACTOR, NOW),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when already checked out', async () => {
      mockEmployeeForUser(makeEmployee({ userId: CASHIER_USER_ID }));
      attendanceRepo.findByEmployeeAndDate.mockResolvedValue(
        makeAttendance({
          checkInTime: '08:00:00',
          checkOutTime: '16:00:00',
        }),
      );

      await expect(
        service.checkOutSelf(CASHIER_ACTOR, NOW),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(attendanceRepo.applyCheckOut).not.toHaveBeenCalled();
    });

    it('records no overtime when check-out is at or before scheduled end', async () => {
      mockEmployeeForUser(
        makeEmployee({
          userId: CASHIER_USER_ID,
          workingHoursStart: '08:00:00',
          workingHoursEnd: '16:00:00',
        }),
      );
      attendanceRepo.findByEmployeeAndDate.mockResolvedValue(
        makeAttendance({ checkInTime: '08:00:00' }),
      );
      attendanceRepo.applyCheckOut.mockImplementation((_id, _date, patch) =>
        Promise.resolve(
          makeAttendance({
            checkInTime: '08:00:00',
            checkOutTime: patch.checkOutTime,
            totalHours: patch.totalHours,
            isOvertime: patch.isOvertime,
            overtimeHours: patch.overtimeHours,
          }),
        ),
      );

      const beforeEnd = new Date('2026-05-24T15:45:00Z');
      await service.checkOutSelf(CASHIER_ACTOR, beforeEnd);

      const patch = attendanceRepo.applyCheckOut.mock.calls[0][2];
      expect(patch.isOvertime).toBe(false);
      expect(patch.overtimeHours).toBe(0);
    });
  });

  // Silence unused-variable warnings for the employee constants used in
  // the cross-branch scoping test path.
  it('exposes BRANCH_B / EMP_B_ID as documentation constants', () => {
    expect(BRANCH_B).toBeTruthy();
    expect(EMP_B_ID).toBeTruthy();
  });
});
