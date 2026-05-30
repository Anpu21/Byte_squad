/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesRepository } from './employees.repository';
import { Employee } from './entities/employee.entity';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { UserRole } from '@common/enums/user-roles.enums';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const ADMIN_ID = 'admin-1';
const MANAGER_ID = 'manager-1';
const EMP_ID = '33333333-3333-3333-3333-333333333333';

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: EMP_ID,
    employeeCode: 'EMP001',
    userId: null,
    branchId: BRANCH_A,
    fullName: 'Jane Doe',
    nameWithInitials: null,
    nic: '991234567V',
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

const MANAGER_B_ACTOR = {
  id: 'manager-2',
  role: UserRole.MANAGER,
  branchId: BRANCH_B,
} as const;

function buildCreateDto(
  overrides: Partial<CreateEmployeeDto> = {},
): CreateEmployeeDto {
  return {
    employeeCode: 'EMP001',
    fullName: 'Jane Doe',
    contactPhone: '+94771234567',
    hireDate: '2024-01-15',
    role: 'Cashier',
    branchId: BRANCH_A,
    ...overrides,
  } as CreateEmployeeDto;
}

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repo: jest.Mocked<EmployeesRepository>;
  let cloudinary: jest.Mocked<CloudinaryService>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<EmployeesRepository>> = {
      findById: jest.fn(),
      findByEmployeeCode: jest.fn(),
      findByNic: jest.fn(),
      listForBranch: jest.fn(),
      save: jest.fn(),
      updatePartial: jest.fn(),
      setPhotoUrl: jest.fn(),
      softTerminate: jest.fn(),
    };
    const cloudinaryMock: Partial<jest.Mocked<CloudinaryService>> = {
      isEnabled: jest.fn(),
      uploadImage: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: EmployeesRepository, useValue: repoMock },
        { provide: CloudinaryService, useValue: cloudinaryMock },
      ],
    }).compile();

    service = module.get(EmployeesService);
    repo = module.get(EmployeesRepository);
    cloudinary = module.get(CloudinaryService);
  });

  describe('list', () => {
    it('admin sees all branches when no branchId filter is passed', async () => {
      repo.listForBranch.mockResolvedValue({
        rows: [makeEmployee(), makeEmployee({ branchId: BRANCH_B })],
        total: 2,
      });

      const result = await service.list({}, ADMIN_ACTOR);

      expect(repo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: undefined }),
      );
      expect(result.total).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('admin can filter by branchId', async () => {
      repo.listForBranch.mockResolvedValue({ rows: [], total: 0 });

      await service.list({ branchId: BRANCH_A }, ADMIN_ACTOR);

      expect(repo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A }),
      );
    });

    it('manager is pinned to their own branch even when query passes a different branchId', async () => {
      repo.listForBranch.mockResolvedValue({ rows: [], total: 0 });

      await service.list({ branchId: BRANCH_B }, MANAGER_A_ACTOR);

      expect(repo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A }),
      );
    });

    it('caps the limit at 100 and floors the offset at 0', async () => {
      repo.listForBranch.mockResolvedValue({ rows: [], total: 0 });

      await service.list({ limit: 999, offset: -5 }, ADMIN_ACTOR);

      expect(repo.listForBranch).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100, offset: 0 }),
      );
    });
  });

  describe('getById', () => {
    it('returns the row for an admin regardless of branch', async () => {
      const row = makeEmployee({ branchId: BRANCH_B });
      repo.findById.mockResolvedValue(row);

      const result = await service.getById(EMP_ID, ADMIN_ACTOR);

      expect(result).toBe(row);
    });

    it('throws NotFound when the row is missing', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById(EMP_ID, ADMIN_ACTOR)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws Forbidden when a manager looks at a row in another branch', async () => {
      repo.findById.mockResolvedValue(makeEmployee({ branchId: BRANCH_A }));

      await expect(
        service.getById(EMP_ID, MANAGER_B_ACTOR),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('create', () => {
    it('stamps createdBy from the actor on the happy path', async () => {
      repo.findByEmployeeCode.mockResolvedValue(null);
      repo.findByNic.mockResolvedValue(null);
      repo.save.mockImplementation((input) =>
        Promise.resolve(makeEmployee(input as Partial<Employee>)),
      );

      const dto = buildCreateDto();
      const result = await service.create(dto, MANAGER_A_ACTOR);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: MANAGER_ID }),
      );
      expect(result.employeeCode).toBe('EMP001');
    });

    it('manager cannot create employees outside their own branch', async () => {
      const dto = buildCreateDto({ branchId: BRANCH_B });

      await expect(service.create(dto, MANAGER_A_ACTOR)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws Conflict when employee_code is already taken', async () => {
      repo.findByEmployeeCode.mockResolvedValue(makeEmployee());

      await expect(
        service.create(buildCreateDto(), ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws Conflict when NIC is already on file', async () => {
      repo.findByEmployeeCode.mockResolvedValue(null);
      repo.findByNic.mockResolvedValue(makeEmployee());

      await expect(
        service.create(buildCreateDto({ nic: '991234567V' }), ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('manager cannot transfer an employee to another branch', async () => {
      repo.findById.mockResolvedValue(makeEmployee());
      const dto: UpdateEmployeeDto = { branchId: BRANCH_B };

      await expect(
        service.update(EMP_ID, dto, MANAGER_A_ACTOR),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.updatePartial).not.toHaveBeenCalled();
    });

    it('admin can transfer an employee to another branch', async () => {
      repo.findById.mockResolvedValue(makeEmployee());
      repo.updatePartial.mockResolvedValue(
        makeEmployee({ branchId: BRANCH_B }),
      );

      const result = await service.update(
        EMP_ID,
        { branchId: BRANCH_B },
        ADMIN_ACTOR,
      );

      expect(result.branchId).toBe(BRANCH_B);
    });

    it('throws Conflict when changing employee_code to one already in use', async () => {
      repo.findById.mockResolvedValue(makeEmployee({ employeeCode: 'EMP001' }));
      repo.findByEmployeeCode.mockResolvedValue(
        makeEmployee({ id: 'other', employeeCode: 'EMP999' }),
      );

      await expect(
        service.update(EMP_ID, { employeeCode: 'EMP999' }, ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws Conflict when changing NIC to one already on file', async () => {
      repo.findById.mockResolvedValue(makeEmployee({ nic: 'OLD' }));
      repo.findByNic.mockResolvedValue(
        makeEmployee({ id: 'other', nic: 'NEW' }),
      );

      await expect(
        service.update(EMP_ID, { nic: 'NEW' }, ADMIN_ACTOR),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('terminate', () => {
    it('sets status, date, and reason on the happy path', async () => {
      repo.findById.mockResolvedValueOnce(makeEmployee()).mockResolvedValueOnce(
        makeEmployee({
          status: 'Terminated',
          terminationDate: new Date('2026-01-31'),
          terminationReason: 'End of contract',
        }),
      );

      const result = await service.terminate(
        EMP_ID,
        { terminationDate: '2026-01-31', reason: 'End of contract' },
        ADMIN_ACTOR,
      );

      expect(repo.softTerminate).toHaveBeenCalledWith(
        EMP_ID,
        'End of contract',
        expect.any(Date),
      );
      expect(result.status).toBe('Terminated');
      expect(result.terminationReason).toBe('End of contract');
    });

    it('throws Conflict when the employee is already terminated', async () => {
      repo.findById.mockResolvedValue(makeEmployee({ status: 'Terminated' }));

      await expect(
        service.terminate(
          EMP_ID,
          { terminationDate: '2026-01-31', reason: 'Duplicate' },
          ADMIN_ACTOR,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.softTerminate).not.toHaveBeenCalled();
    });
  });

  describe('uploadPhoto', () => {
    it('uploads via Cloudinary and persists the secure URL', async () => {
      repo.findById
        .mockResolvedValueOnce(makeEmployee())
        .mockResolvedValueOnce(makeEmployee({ photoUrl: 'https://cdn/x.jpg' }));
      cloudinary.isEnabled.mockReturnValue(true);
      cloudinary.uploadImage.mockResolvedValue({
        url: 'https://cdn/x.jpg',
        publicId: `ledgerpro/employees/${EMP_ID}`,
      });
      const file = {
        buffer: Buffer.from('img'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = await service.uploadPhoto(EMP_ID, file, ADMIN_ACTOR);

      expect(cloudinary.uploadImage).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ publicId: EMP_ID }),
      );
      expect(repo.setPhotoUrl).toHaveBeenCalledWith(
        EMP_ID,
        'https://cdn/x.jpg',
      );
      expect(result.photoUrl).toBe('https://cdn/x.jpg');
    });

    it('falls back to base64 when Cloudinary is disabled', async () => {
      repo.findById.mockResolvedValueOnce(makeEmployee()).mockResolvedValueOnce(
        makeEmployee({
          photoUrl: 'data:image/png;base64,aW1n',
        }),
      );
      cloudinary.isEnabled.mockReturnValue(false);
      const file = {
        buffer: Buffer.from('img'),
        mimetype: 'image/png',
      } as Express.Multer.File;

      await service.uploadPhoto(EMP_ID, file, ADMIN_ACTOR);

      expect(cloudinary.uploadImage).not.toHaveBeenCalled();
      expect(repo.setPhotoUrl).toHaveBeenCalledWith(
        EMP_ID,
        'data:image/png;base64,aW1n',
      );
    });
  });
});
