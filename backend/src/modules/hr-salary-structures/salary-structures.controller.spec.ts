/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { SalaryStructuresController } from './salary-structures.controller';
import {
  SalaryStructuresService,
  type SalaryActor,
} from './salary-structures.service';
import { SalaryStructure } from './entities/salary-structure.entity';

const STRUCT_ID = 'struct-1';
const EMP_ID = '33333333-3333-3333-3333-333333333333';
const ADMIN_ACTOR: SalaryActor = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  branchId: null,
};

function makeStructure(
  overrides: Partial<SalaryStructure> = {},
): SalaryStructure {
  return {
    id: STRUCT_ID,
    employeeId: EMP_ID,
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
    createdBy: 'admin-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as SalaryStructure;
}

describe('SalaryStructuresController', () => {
  let controller: SalaryStructuresController;
  let service: jest.Mocked<SalaryStructuresService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SalaryStructuresController],
      providers: [
        {
          provide: SalaryStructuresService,
          useValue: {
            list: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deactivate: jest.fn(),
            getActiveOn: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(SalaryStructuresController);
    service = moduleRef.get(SalaryStructuresService);
  });

  it('list rejects when employeeId is missing', () => {
    expect(() => controller.list(undefined, ADMIN_ACTOR)).toThrow(
      BadRequestException,
    );
    expect(service.list).not.toHaveBeenCalled();
  });

  it('list forwards employeeId and actor to the service', async () => {
    service.list.mockResolvedValue([makeStructure()]);
    const out = await controller.list(EMP_ID, ADMIN_ACTOR);
    expect(service.list).toHaveBeenCalledWith(EMP_ID, ADMIN_ACTOR);
    expect(out).toHaveLength(1);
  });

  it('create delegates body and actor to the service', async () => {
    const dto = {
      employeeId: EMP_ID,
      salaryType: 'Monthly_Fixed' as const,
      monthlyBase: 120000,
      effectiveFromDate: '2026-06-01',
    };
    service.create.mockResolvedValue(makeStructure());
    await controller.create(dto, ADMIN_ACTOR);
    expect(service.create).toHaveBeenCalledWith(dto, ADMIN_ACTOR);
  });

  it('deactivate delegates the id and actor to the service', async () => {
    service.deactivate.mockResolvedValue(makeStructure({ status: 'Inactive' }));
    await controller.deactivate(STRUCT_ID, ADMIN_ACTOR);
    expect(service.deactivate).toHaveBeenCalledWith(STRUCT_ID, ADMIN_ACTOR);
  });
});
