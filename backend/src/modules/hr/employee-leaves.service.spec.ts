/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { EmployeeLeavesService } from './employee-leaves.service';
import { EmployeeLeavesRepository } from './employee-leaves.repository';
import { EmployeesRepository } from './employees.repository';
import { Employee } from './entities/employee.entity';
import { EmployeeLeave } from './entities/employee-leave.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const EMP_A_ID = '33333333-3333-3333-3333-333333333333';
const EMP_B_ID = '44444444-4444-4444-4444-444444444444';
const ADMIN_ID = 'admin-1';
const MANAGER_ID = 'manager-1';
const CASHIER_USER_ID = 'cashier-user-1';
const LEAVE_ID = 'leave-1';

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

function makeLeave(overrides: Partial<EmployeeLeave> = {}): EmployeeLeave {
  return {
    id: LEAVE_ID,
    employeeId: EMP_A_ID,
    leaveType: 'Annual',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-02'),
    totalDays: 2,
    reason: null,
    status: 'Pending',
    appliedDate: new Date('2026-05-20'),
    approvedBy: null,
    approvedDate: null,
    rejectionReason: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as EmployeeLeave;
}

describe('EmployeeLeavesService', () => {
  let service: EmployeeLeavesService;
  let leavesRepo: jest.Mocked<EmployeeLeavesRepository>;
  let employeesRepo: jest.Mocked<EmployeesRepository>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb({} as unknown)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        EmployeeLeavesService,
        {
          provide: EmployeeLeavesRepository,
          useValue: {
            findById: jest.fn(),
            listForBranch: jest.fn(),
            findOverlapping: jest.fn(),
            save: jest.fn(),
            updatePartial: jest.fn(),
          },
        },
        {
          provide: EmployeesRepository,
          useValue: {
            findById: jest.fn(),
            findByUserId: jest.fn(),
            adjustAnnualLeaveBalance: jest.fn(),
          },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(EmployeeLeavesService);
    leavesRepo = moduleRef.get(EmployeeLeavesRepository);
    employeesRepo = moduleRef.get(EmployeesRepository);
  });

  describe('list', () => {
    it('admin can span all branches via empty filter', async () => {
      leavesRepo.listForBranch.mockResolvedValue({ rows: [], total: 0 });
      await service.list(
        { limit: 20, offset: 0 },
        { id: ADMIN_ID, role: UserRole.ADMIN, branchId: null },
      );
      expect(leavesRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: undefined }),
      );
    });

    it('manager is pinned to own branch regardless of query', async () => {
      leavesRepo.listForBranch.mockResolvedValue({ rows: [], total: 0 });
      await service.list(
        { branchId: BRANCH_B, limit: 20, offset: 0 },
        { id: MANAGER_ID, role: UserRole.MANAGER, branchId: BRANCH_A },
      );
      expect(leavesRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A }),
      );
    });

    it('cashier is forced to own employeeId', async () => {
      employeesRepo.findByUserId.mockResolvedValue(makeEmployee());
      leavesRepo.listForBranch.mockResolvedValue({ rows: [], total: 0 });
      await service.list(
        { employeeId: EMP_B_ID, limit: 20, offset: 0 },
        {
          id: CASHIER_USER_ID,
          role: UserRole.CASHIER,
          branchId: BRANCH_A,
        },
      );
      expect(leavesRepo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: EMP_A_ID }),
      );
    });
  });

  describe('apply', () => {
    const baseDto = {
      employeeId: EMP_A_ID,
      leaveType: 'Annual' as const,
      startDate: '2026-06-01',
      endDate: '2026-06-02',
      totalDays: 2,
    };

    it('happy path inserts Pending with appliedDate today', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      leavesRepo.findOverlapping.mockResolvedValue([]);
      leavesRepo.save.mockImplementation((input) =>
        Promise.resolve(makeLeave(input as Partial<EmployeeLeave>)),
      );
      const result = await service.apply(baseDto, {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });
      expect(leavesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: EMP_A_ID,
          leaveType: 'Annual',
          status: 'Pending',
        }),
      );
      expect(result.status).toBe('Pending');
    });

    it('cashier cannot apply for someone else', async () => {
      employeesRepo.findByUserId.mockResolvedValue(makeEmployee());
      await expect(
        service.apply(
          { ...baseDto, employeeId: EMP_B_ID },
          {
            id: CASHIER_USER_ID,
            role: UserRole.CASHIER,
            branchId: BRANCH_A,
          },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(leavesRepo.save).not.toHaveBeenCalled();
    });

    it('manager cannot apply on-behalf across branches', async () => {
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ branchId: BRANCH_B }),
      );
      await expect(
        service.apply(baseDto, {
          id: MANAGER_ID,
          role: UserRole.MANAGER,
          branchId: BRANCH_A,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when startDate > endDate', async () => {
      await expect(
        service.apply(
          { ...baseDto, startDate: '2026-06-05', endDate: '2026-06-01' },
          { id: ADMIN_ID, role: UserRole.ADMIN, branchId: null },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects overlapping Pending/Approved leave (409)', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      leavesRepo.findOverlapping.mockResolvedValue([makeLeave()]);
      await expect(
        service.apply(baseDto, {
          id: ADMIN_ID,
          role: UserRole.ADMIN,
          branchId: null,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects Annual leave when balance is insufficient (422)', async () => {
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ annualLeaveBalance: 1 }),
      );
      leavesRepo.findOverlapping.mockResolvedValue([]);
      await expect(
        service.apply(
          { ...baseDto, totalDays: 3 },
          { id: ADMIN_ID, role: UserRole.ADMIN, branchId: null },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('Sick leave bypasses the balance check', async () => {
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ annualLeaveBalance: 0 }),
      );
      leavesRepo.findOverlapping.mockResolvedValue([]);
      leavesRepo.save.mockImplementation((input) =>
        Promise.resolve(makeLeave(input as Partial<EmployeeLeave>)),
      );
      await service.apply(
        { ...baseDto, leaveType: 'Sick', totalDays: 1 },
        { id: ADMIN_ID, role: UserRole.ADMIN, branchId: null },
      );
      expect(leavesRepo.save).toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('happy path Annual leave decrements balance in a txn', async () => {
      const leave = makeLeave({ status: 'Pending', totalDays: 2 });
      leavesRepo.findById
        .mockResolvedValueOnce(leave)
        .mockResolvedValueOnce({ ...leave, status: 'Approved' });
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      leavesRepo.updatePartial.mockResolvedValue({
        ...leave,
        status: 'Approved',
      });

      const result = await service.approve(LEAVE_ID, {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(employeesRepo.adjustAnnualLeaveBalance).toHaveBeenCalledWith(
        EMP_A_ID,
        -2,
        expect.anything(),
      );
      expect(result.status).toBe('Approved');
    });

    it('refuses to re-approve a non-Pending leave (409)', async () => {
      leavesRepo.findById.mockResolvedValue(makeLeave({ status: 'Approved' }));
      await expect(
        service.approve(LEAVE_ID, {
          id: ADMIN_ID,
          role: UserRole.ADMIN,
          branchId: null,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('Sick leave approval skips the balance adjustment', async () => {
      const leave = makeLeave({ status: 'Pending', leaveType: 'Sick' });
      leavesRepo.findById
        .mockResolvedValueOnce(leave)
        .mockResolvedValueOnce({ ...leave, status: 'Approved' });
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      leavesRepo.updatePartial.mockResolvedValue({
        ...leave,
        status: 'Approved',
      });

      await service.approve(LEAVE_ID, {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });
      expect(employeesRepo.adjustAnnualLeaveBalance).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('happy path sets Rejected + reason', async () => {
      leavesRepo.findById.mockResolvedValue(makeLeave());
      leavesRepo.updatePartial.mockResolvedValue(
        makeLeave({
          status: 'Rejected',
          rejectionReason: 'Insufficient cover',
        }),
      );
      const result = await service.reject(
        LEAVE_ID,
        { rejectionReason: 'Insufficient cover' },
        { id: ADMIN_ID, role: UserRole.ADMIN, branchId: null },
      );
      expect(result.status).toBe('Rejected');
      expect(leavesRepo.updatePartial).toHaveBeenCalledWith(
        LEAVE_ID,
        expect.objectContaining({
          status: 'Rejected',
          rejectionReason: 'Insufficient cover',
        }),
      );
    });

    it('refuses to reject a non-Pending leave', async () => {
      leavesRepo.findById.mockResolvedValue(makeLeave({ status: 'Approved' }));
      await expect(
        service.reject(
          LEAVE_ID,
          { rejectionReason: 'too late' },
          { id: ADMIN_ID, role: UserRole.ADMIN, branchId: null },
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('cancel', () => {
    it('cashier can self-cancel while Pending', async () => {
      const leave = makeLeave({ status: 'Pending' });
      leavesRepo.findById
        .mockResolvedValueOnce(leave)
        .mockResolvedValueOnce({ ...leave, status: 'Cancelled' });
      employeesRepo.findByUserId.mockResolvedValue(makeEmployee());
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      leavesRepo.updatePartial.mockResolvedValue({
        ...leave,
        status: 'Cancelled',
      });

      const result = await service.cancel(LEAVE_ID, {
        id: CASHIER_USER_ID,
        role: UserRole.CASHIER,
        branchId: BRANCH_A,
      });
      expect(result.status).toBe('Cancelled');
    });

    it('reverts annual balance when admin cancels an Approved Annual leave', async () => {
      const leave = makeLeave({
        status: 'Approved',
        leaveType: 'Annual',
        totalDays: 2,
      });
      leavesRepo.findById
        .mockResolvedValueOnce(leave)
        .mockResolvedValueOnce({ ...leave, status: 'Cancelled' });
      leavesRepo.updatePartial.mockResolvedValue({
        ...leave,
        status: 'Cancelled',
      });

      await service.cancel(LEAVE_ID, {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });
      expect(employeesRepo.adjustAnnualLeaveBalance).toHaveBeenCalledWith(
        EMP_A_ID,
        +2,
        expect.anything(),
      );
    });

    it('cashier cannot cancel an Approved leave', async () => {
      const leave = makeLeave({ status: 'Approved' });
      leavesRepo.findById.mockResolvedValue(leave);
      employeesRepo.findByUserId.mockResolvedValue(makeEmployee());
      employeesRepo.findById.mockResolvedValue(makeEmployee());

      await expect(
        service.cancel(LEAVE_ID, {
          id: CASHIER_USER_ID,
          role: UserRole.CASHIER,
          branchId: BRANCH_A,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getById', () => {
    it('404 when missing', async () => {
      leavesRepo.findById.mockResolvedValue(null);
      await expect(
        service.getById(LEAVE_ID, {
          id: ADMIN_ID,
          role: UserRole.ADMIN,
          branchId: null,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('manager forbidden across branches', async () => {
      leavesRepo.findById.mockResolvedValue(makeLeave());
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ branchId: BRANCH_B }),
      );
      await expect(
        service.getById(LEAVE_ID, {
          id: MANAGER_ID,
          role: UserRole.MANAGER,
          branchId: BRANCH_A,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
