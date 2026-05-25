/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { EmployeeLeavesController } from './employee-leaves.controller';
import { EmployeeLeavesService } from './employee-leaves.service';
import type { LeavesActor } from './employee-leaves.service';
import { EmployeeLeave } from './entities/employee-leave.entity';

const ADMIN_ACTOR: LeavesActor = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  branchId: null,
};
const LEAVE_ID = 'leave-1';

function makeLeave(over: Partial<EmployeeLeave> = {}): EmployeeLeave {
  return {
    id: LEAVE_ID,
    employeeId: 'emp-1',
    leaveType: 'Annual',
    startDate: new Date(),
    endDate: new Date(),
    totalDays: 1,
    reason: null,
    status: 'Pending',
    appliedDate: new Date(),
    approvedBy: null,
    approvedDate: null,
    rejectionReason: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as EmployeeLeave;
}

describe('EmployeeLeavesController', () => {
  let controller: EmployeeLeavesController;
  let service: jest.Mocked<EmployeeLeavesService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EmployeeLeavesController],
      providers: [
        {
          provide: EmployeeLeavesService,
          useValue: {
            list: jest.fn(),
            getById: jest.fn(),
            apply: jest.fn(),
            approve: jest.fn(),
            reject: jest.fn(),
            cancel: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(EmployeeLeavesController);
    service = moduleRef.get(EmployeeLeavesService);
  });

  it('delegates list to the service', async () => {
    service.list.mockResolvedValue({
      rows: [],
      total: 0,
      limit: 20,
      offset: 0,
    });
    await controller.list({ limit: 20, offset: 0 }, ADMIN_ACTOR);
    expect(service.list).toHaveBeenCalledWith(
      { limit: 20, offset: 0 },
      ADMIN_ACTOR,
    );
  });

  it('delegates apply to the service', async () => {
    const dto = {
      employeeId: 'emp-1',
      leaveType: 'Annual' as const,
      startDate: '2026-06-01',
      endDate: '2026-06-01',
      totalDays: 1,
    };
    service.apply.mockResolvedValue(makeLeave());
    await controller.apply(dto, ADMIN_ACTOR);
    expect(service.apply).toHaveBeenCalledWith(dto, ADMIN_ACTOR);
  });

  it('delegates approve to the service', async () => {
    service.approve.mockResolvedValue(makeLeave({ status: 'Approved' }));
    await controller.approve(LEAVE_ID, ADMIN_ACTOR);
    expect(service.approve).toHaveBeenCalledWith(LEAVE_ID, ADMIN_ACTOR);
  });

  it('delegates cancel to the service', async () => {
    service.cancel.mockResolvedValue(makeLeave({ status: 'Cancelled' }));
    await controller.cancel(LEAVE_ID, ADMIN_ACTOR);
    expect(service.cancel).toHaveBeenCalledWith(LEAVE_ID, ADMIN_ACTOR);
  });
});
