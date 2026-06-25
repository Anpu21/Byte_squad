/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PayrollSettingsController } from './payroll-settings.controller';
import {
  PayrollSettingsService,
  type PayrollSettingsActor,
} from './payroll-settings.service';
import { PayrollSettings } from './entities/payroll-settings.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const ADMIN_ACTOR: PayrollSettingsActor = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  branchId: null,
};
const MANAGER_ACTOR: PayrollSettingsActor = {
  id: 'manager-1',
  role: UserRole.MANAGER,
  branchId: BRANCH_A,
};

function makeSettings(
  overrides: Partial<PayrollSettings> = {},
): PayrollSettings {
  return {
    id: 'settings-global',
    branchId: null,
    epfEmployeePercent: 8,
    epfEmployerPercent: 12,
    etfEmployerPercent: 3,
    attendanceBonusThreshold: 26,
    lateGraceMinutes: 15,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as PayrollSettings;
}

describe('PayrollSettingsController', () => {
  let controller: PayrollSettingsController;
  let service: jest.Mocked<PayrollSettingsService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PayrollSettingsController],
      providers: [
        {
          provide: PayrollSettingsService,
          useValue: {
            getGlobal: jest.fn(),
            getEffective: jest.fn(),
            updateGlobal: jest.fn(),
            upsertBranch: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(PayrollSettingsController);
    service = moduleRef.get(PayrollSettingsService);
  });

  it('getEffective pins manager to their own branch regardless of query', async () => {
    service.getEffective.mockResolvedValue(
      makeSettings({ branchId: BRANCH_A }),
    );
    await controller.getEffective(BRANCH_B, MANAGER_ACTOR);
    expect(service.getEffective).toHaveBeenCalledWith(BRANCH_A);
  });

  it('getEffective forwards admin branchId to the service', async () => {
    service.getEffective.mockResolvedValue(
      makeSettings({ branchId: BRANCH_B }),
    );
    await controller.getEffective(BRANCH_B, ADMIN_ACTOR);
    expect(service.getEffective).toHaveBeenCalledWith(BRANCH_B);
  });

  it('updateGlobal forwards body and actor to the service', async () => {
    service.updateGlobal.mockResolvedValue(
      makeSettings({ lateGraceMinutes: 20 }),
    );
    const dto = { lateGraceMinutes: 20 };
    await controller.updateGlobal(dto, ADMIN_ACTOR);
    expect(service.updateGlobal).toHaveBeenCalledWith(dto, ADMIN_ACTOR);
  });

  it('upsertBranch forwards body and actor to the service', async () => {
    service.upsertBranch.mockResolvedValue(
      makeSettings({ id: 'settings-branch-a', branchId: BRANCH_A }),
    );
    const dto = { branchId: BRANCH_A, lateGraceMinutes: 10 };
    await controller.upsertBranch(dto, MANAGER_ACTOR);
    expect(service.upsertBranch).toHaveBeenCalledWith(dto, MANAGER_ACTOR);
  });
});
