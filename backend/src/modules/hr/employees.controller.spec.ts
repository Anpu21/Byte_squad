/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService, type EmployeesListActor } from './employees.service';
import { Employee } from './entities/employee.entity';
import { UserRole } from '@common/enums/user-roles.enums';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const EMP_ID = '33333333-3333-3333-3333-333333333333';

function makeEmployee(): Employee {
  return {
    id: EMP_ID,
    employeeCode: 'EMP001',
    branchId: BRANCH_A,
    fullName: 'Jane Doe',
    contactPhone: '+94771234567',
    hireDate: new Date('2024-01-15'),
    role: 'Cashier',
    employeeType: 'Permanent',
    status: 'Active',
    workingHoursStart: '08:00:00',
    workingHoursEnd: '16:00:00',
    epfEligible: false,
    etfEligible: false,
    annualLeaveBalance: 14,
    userId: null,
    nameWithInitials: null,
    nic: null,
    dateOfBirth: null,
    gender: null,
    maritalStatus: null,
    contactPhone2: null,
    email: null,
    permanentAddress: null,
    currentAddress: null,
    city: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
    confirmationDate: null,
    epfNumber: null,
    etfNumber: null,
    bankName: null,
    bankAccountNo: null,
    bankBranch: null,
    bankAccountName: null,
    resignationDate: null,
    resignationReason: null,
    terminationDate: null,
    terminationReason: null,
    notes: null,
    photoUrl: null,
    createdBy: 'admin-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Employee;
}

const ADMIN_ACTOR: EmployeesListActor = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  branchId: null,
};

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let service: jest.Mocked<EmployeesService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<EmployeesService>> = {
      list: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      terminate: jest.fn(),
      uploadPhoto: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [{ provide: EmployeesService, useValue: serviceMock }],
    }).compile();

    controller = module.get(EmployeesController);
    service = module.get(EmployeesService);
  });

  it('list forwards query and actor to the service', async () => {
    service.list.mockResolvedValue({
      rows: [makeEmployee()],
      total: 1,
      limit: 20,
      offset: 0,
    });

    const result = await controller.list({}, ADMIN_ACTOR);

    expect(service.list).toHaveBeenCalledWith({}, ADMIN_ACTOR);
    expect(result.total).toBe(1);
  });

  it('create delegates to the service with body and actor', async () => {
    const dto = {
      employeeCode: 'EMP001',
      fullName: 'Jane Doe',
      contactPhone: '+94771234567',
      hireDate: '2024-01-15',
      role: 'Cashier',
      branchId: BRANCH_A,
    };
    service.create.mockResolvedValue(makeEmployee());

    await controller.create(dto, ADMIN_ACTOR);

    expect(service.create).toHaveBeenCalledWith(dto, ADMIN_ACTOR);
  });

  it('terminate delegates to the service with id, body, and actor', async () => {
    service.terminate.mockResolvedValue(makeEmployee());

    const body = { terminationDate: '2026-01-31', reason: 'End of contract' };
    await controller.terminate(EMP_ID, body, ADMIN_ACTOR);

    expect(service.terminate).toHaveBeenCalledWith(EMP_ID, body, ADMIN_ACTOR);
  });

  it('uploadPhoto delegates the multipart file to the service', async () => {
    service.uploadPhoto.mockResolvedValue(makeEmployee());
    const file = {
      buffer: Buffer.from('img'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    await controller.uploadPhoto(EMP_ID, file, ADMIN_ACTOR);

    expect(service.uploadPhoto).toHaveBeenCalledWith(EMP_ID, file, ADMIN_ACTOR);
  });
});
