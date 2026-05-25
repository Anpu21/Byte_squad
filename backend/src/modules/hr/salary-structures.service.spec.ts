/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { SalaryStructuresService } from './salary-structures.service';
import { SalaryStructuresRepository } from './salary-structures.repository';
import { EmployeesRepository } from './employees.repository';
import { Employee } from './entities/employee.entity';
import { SalaryStructure } from './entities/salary-structure.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const EMP_A_ID = '33333333-3333-3333-3333-333333333333';
const ADMIN_ID = 'admin-1';
const MANAGER_ID = 'manager-1';
const STRUCT_ID = 'struct-1';

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

function makeStructure(
  overrides: Partial<SalaryStructure> = {},
): SalaryStructure {
  return {
    id: STRUCT_ID,
    employeeId: EMP_A_ID,
    salaryType: 'Monthly_Fixed',
    monthlyBase: 100000,
    dailyRate: 0,
    productionRatePerCard: 0,
    teaAllowanceDaily: 60,
    otRatePerHour: 400,
    attendanceBonusAmount: 0,
    effectiveFromDate: new Date('2026-01-01'),
    effectiveToDate: null,
    status: 'Active',
    notes: null,
    createdBy: ADMIN_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as SalaryStructure;
}

describe('SalaryStructuresService', () => {
  let service: SalaryStructuresService;
  let structRepo: jest.Mocked<SalaryStructuresRepository>;
  let employeesRepo: jest.Mocked<EmployeesRepository>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb({} as unknown)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        SalaryStructuresService,
        {
          provide: SalaryStructuresRepository,
          useValue: {
            findById: jest.fn(),
            listForEmployee: jest.fn(),
            findActiveOn: jest.fn(),
            save: jest.fn(),
            updatePartial: jest.fn(),
            deactivate: jest.fn(),
          },
        },
        {
          provide: EmployeesRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(SalaryStructuresService);
    structRepo = moduleRef.get(SalaryStructuresRepository);
    employeesRepo = moduleRef.get(EmployeesRepository);
  });

  describe('list', () => {
    it('forbids a manager from listing structures for an employee in another branch', async () => {
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ branchId: BRANCH_B }),
      );
      await expect(
        service.list(EMP_A_ID, {
          id: MANAGER_ID,
          role: UserRole.MANAGER,
          branchId: BRANCH_A,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(structRepo.listForEmployee).not.toHaveBeenCalled();
    });

    it('admin can list any employee', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      structRepo.listForEmployee.mockResolvedValue([makeStructure()]);
      const out = await service.list(EMP_A_ID, {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });
      expect(out).toHaveLength(1);
      expect(structRepo.listForEmployee).toHaveBeenCalledWith(EMP_A_ID);
    });
  });

  describe('create', () => {
    const baseDto = {
      employeeId: EMP_A_ID,
      salaryType: 'Monthly_Fixed' as const,
      monthlyBase: 120000,
      effectiveFromDate: '2026-06-01',
    };

    it('happy path deactivates the previous open Active structure in a txn', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      structRepo.listForEmployee.mockResolvedValue([
        makeStructure({ effectiveToDate: null }),
      ]);
      structRepo.save.mockImplementation((input) =>
        Promise.resolve(makeStructure(input as Partial<SalaryStructure>)),
      );

      await service.create(baseDto, {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(structRepo.deactivate).toHaveBeenCalledWith(
        STRUCT_ID,
        // 2026-05-31 — one day before the new effectiveFromDate.
        new Date(Date.UTC(2026, 4, 31)),
        expect.anything(),
      );
      expect(structRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: EMP_A_ID,
          status: 'Active',
          salaryType: 'Monthly_Fixed',
        }),
        expect.anything(),
      );
    });

    it('forbids manager from creating a structure for another branch', async () => {
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ branchId: BRANCH_B }),
      );
      await expect(
        service.create(baseDto, {
          id: MANAGER_ID,
          role: UserRole.MANAGER,
          branchId: BRANCH_A,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(structRepo.save).not.toHaveBeenCalled();
    });

    it('does not deactivate when there is no prior Active structure', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      structRepo.listForEmployee.mockResolvedValue([]);
      structRepo.save.mockImplementation((input) =>
        Promise.resolve(makeStructure(input as Partial<SalaryStructure>)),
      );

      await service.create(baseDto, {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });
      expect(structRepo.deactivate).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('happy path patches the existing row', async () => {
      structRepo.findById.mockResolvedValue(makeStructure());
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      structRepo.listForEmployee.mockResolvedValue([makeStructure()]);
      structRepo.updatePartial.mockResolvedValue(
        makeStructure({ monthlyBase: 140000 }),
      );

      const out = await service.update(
        STRUCT_ID,
        { monthlyBase: 140000 },
        { id: ADMIN_ID, role: UserRole.ADMIN, branchId: null },
      );
      expect(out.monthlyBase).toBe(140000);
      expect(structRepo.updatePartial).toHaveBeenCalledWith(
        STRUCT_ID,
        expect.objectContaining({ monthlyBase: 140000 }),
      );
    });

    it('rejects an update that would overlap another Active structure', async () => {
      structRepo.findById.mockResolvedValue(makeStructure());
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      // Existing other Active row covering Jun-Jul 2026.
      structRepo.listForEmployee.mockResolvedValue([
        makeStructure(),
        makeStructure({
          id: 'other-1',
          effectiveFromDate: new Date('2026-06-01'),
          effectiveToDate: new Date('2026-07-31'),
          status: 'Active',
        }),
      ]);

      await expect(
        service.update(
          STRUCT_ID,
          { effectiveFromDate: '2026-06-15' },
          { id: ADMIN_ID, role: UserRole.ADMIN, branchId: null },
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('forbids manager from updating a cross-branch structure', async () => {
      structRepo.findById.mockResolvedValue(makeStructure());
      employeesRepo.findById.mockResolvedValue(
        makeEmployee({ branchId: BRANCH_B }),
      );
      await expect(
        service.update(
          STRUCT_ID,
          { monthlyBase: 50 },
          { id: MANAGER_ID, role: UserRole.MANAGER, branchId: BRANCH_A },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('deactivate', () => {
    it('happy path stamps Inactive + effectiveToDate', async () => {
      structRepo.findById
        .mockResolvedValueOnce(makeStructure())
        .mockResolvedValueOnce(
          makeStructure({ status: 'Inactive', effectiveToDate: new Date() }),
        );
      employeesRepo.findById.mockResolvedValue(makeEmployee());

      const out = await service.deactivate(STRUCT_ID, {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });
      expect(structRepo.deactivate).toHaveBeenCalledWith(
        STRUCT_ID,
        expect.any(Date),
      );
      expect(out.status).toBe('Inactive');
    });

    it('refuses to deactivate an already-inactive structure', async () => {
      structRepo.findById.mockResolvedValue(
        makeStructure({ status: 'Inactive' }),
      );
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      await expect(
        service.deactivate(STRUCT_ID, {
          id: ADMIN_ID,
          role: UserRole.ADMIN,
          branchId: null,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getActiveOn', () => {
    it('picks the right row by date', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      const target = makeStructure({
        effectiveFromDate: new Date('2026-03-01'),
      });
      structRepo.findActiveOn.mockResolvedValue(target);

      const out = await service.getActiveOn(EMP_A_ID, new Date('2026-04-15'), {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });
      expect(out).toBe(target);
      expect(structRepo.findActiveOn).toHaveBeenCalledWith(
        EMP_A_ID,
        new Date('2026-04-15'),
      );
    });

    it('returns null when nothing matches', async () => {
      employeesRepo.findById.mockResolvedValue(makeEmployee());
      structRepo.findActiveOn.mockResolvedValue(null);
      const out = await service.getActiveOn(EMP_A_ID, new Date('2020-01-01'), {
        id: ADMIN_ID,
        role: UserRole.ADMIN,
        branchId: null,
      });
      expect(out).toBeNull();
    });
  });

  describe('getById', () => {
    it('404 when missing', async () => {
      structRepo.findById.mockResolvedValue(null);
      await expect(
        service.getById(STRUCT_ID, {
          id: ADMIN_ID,
          role: UserRole.ADMIN,
          branchId: null,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
