/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService, type AttendanceActor } from './attendance.service';
import { Attendance } from './entities/attendance.entity';
import { UserRole } from '@common/enums/user-roles.enums';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const EMP_ID = '33333333-3333-3333-3333-333333333333';

function makeAttendance(overrides: Partial<Attendance> = {}): Attendance {
  return {
    id: 'att-1',
    employeeId: EMP_ID,
    attendanceDate: new Date('2026-05-24'),
    checkInTime: '08:00:00',
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
    createdBy: 'admin-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Attendance;
}

const ADMIN_ACTOR: AttendanceActor = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  branchId: null,
};

const CASHIER_ACTOR: AttendanceActor = {
  id: 'cashier-user-1',
  role: UserRole.CASHIER,
  branchId: BRANCH_A,
};

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: jest.Mocked<AttendanceService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<AttendanceService>> = {
      list: jest.fn(),
      bulkUpsert: jest.fn(),
      checkInSelf: jest.fn(),
      checkOutSelf: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [{ provide: AttendanceService, useValue: serviceMock }],
    }).compile();

    controller = module.get(AttendanceController);
    service = module.get(AttendanceService);
  });

  it('list forwards query and actor to the service', async () => {
    service.list.mockResolvedValue({ rows: [makeAttendance()], total: 1 });

    const query = { startDate: '2026-05-01', endDate: '2026-05-31' };
    const result = await controller.list(query, ADMIN_ACTOR);

    expect(service.list).toHaveBeenCalledWith(query, ADMIN_ACTOR);
    expect(result.total).toBe(1);
  });

  it('bulk delegates the body + actor to the service', async () => {
    service.bulkUpsert.mockResolvedValue([makeAttendance()]);
    const dto = {
      rows: [
        {
          employeeId: EMP_ID,
          attendanceDate: '2026-05-24',
          status: 'Present' as const,
          checkInTime: '08:00',
        },
      ],
    };

    await controller.bulk(dto, ADMIN_ACTOR);

    expect(service.bulkUpsert).toHaveBeenCalledWith(dto, ADMIN_ACTOR);
  });

  it('check-in delegates the actor (and a real Date) to the service', async () => {
    service.checkInSelf.mockResolvedValue(
      makeAttendance({ markedBy: 'Cashier_Self' }),
    );

    const result = await controller.checkIn(CASHIER_ACTOR);

    expect(service.checkInSelf).toHaveBeenCalledWith(
      CASHIER_ACTOR,
      expect.any(Date),
    );
    expect(result.markedBy).toBe('Cashier_Self');
  });

  it('check-out delegates the actor (and a real Date) to the service', async () => {
    service.checkOutSelf.mockResolvedValue(
      makeAttendance({ checkOutTime: '17:00:00' }),
    );

    const result = await controller.checkOut(CASHIER_ACTOR);

    expect(service.checkOutSelf).toHaveBeenCalledWith(
      CASHIER_ACTOR,
      expect.any(Date),
    );
    expect(result.checkOutTime).toBe('17:00:00');
  });
});
