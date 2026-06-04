/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PayrollController } from './payroll.controller';
import { PayrollService, type PayrollActor } from './payroll.service';
import { Payroll } from './entities/payroll.entity';

const PAYROLL_ID = '55555555-5555-5555-5555-555555555555';
const ADMIN_ACTOR: PayrollActor = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  branchId: null,
};

function makePayroll(over: Partial<Payroll> = {}): Payroll {
  return {
    id: PAYROLL_ID,
    employeeId: 'emp-1',
    payPeriodMonth: 5,
    payPeriodYear: 2026,
    paymentStatus: 'Pending',
    netSalary: 92000,
    ...over,
  } as Payroll;
}

interface MockResponse {
  setHeader: jest.Mock;
  send: jest.Mock;
}

function makeRes(): MockResponse {
  return {
    setHeader: jest.fn(),
    send: jest.fn(),
  };
}

describe('PayrollController', () => {
  let controller: PayrollController;
  let service: jest.Mocked<PayrollService>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PayrollController],
      providers: [
        {
          provide: PayrollService,
          useValue: {
            list: jest.fn(),
            getById: jest.fn(),
            generate: jest.fn(),
            approve: jest.fn(),
            markPaid: jest.fn(),
            cancel: jest.fn(),
            exportCsv: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(PayrollController);
    service = moduleRef.get(PayrollService);
  });

  it('list delegates query and actor to the service', async () => {
    service.list.mockResolvedValue({
      rows: [],
      total: 0,
      limit: 20,
      offset: 0,
    });
    await controller.list({ limit: 20 }, ADMIN_ACTOR);
    expect(service.list).toHaveBeenCalledWith({ limit: 20 }, ADMIN_ACTOR);
  });

  it('generate delegates body and actor', async () => {
    service.generate.mockResolvedValue({ rows: [makePayroll()], skipped: [] });
    await controller.generate({ month: 5, year: 2026 }, ADMIN_ACTOR);
    expect(service.generate).toHaveBeenCalledWith(
      { month: 5, year: 2026 },
      ADMIN_ACTOR,
    );
  });

  it('approve delegates id and actor', async () => {
    service.approve.mockResolvedValue(
      makePayroll({ paymentStatus: 'Approved' }),
    );
    await controller.approve(PAYROLL_ID, ADMIN_ACTOR);
    expect(service.approve).toHaveBeenCalledWith(PAYROLL_ID, ADMIN_ACTOR);
  });

  it('markPaid delegates dto and actor', async () => {
    const dto = {
      paymentDate: '2026-06-05',
      paymentMethod: 'Bank_Transfer' as const,
      bankReferenceNo: 'TRX-001',
    };
    service.markPaid.mockResolvedValue(makePayroll({ paymentStatus: 'Paid' }));
    await controller.markPaid(PAYROLL_ID, dto, ADMIN_ACTOR);
    expect(service.markPaid).toHaveBeenCalledWith(PAYROLL_ID, dto, ADMIN_ACTOR);
  });

  it('cancel delegates id and actor', async () => {
    service.cancel.mockResolvedValue(
      makePayroll({ paymentStatus: 'Cancelled' }),
    );
    await controller.cancel(PAYROLL_ID, ADMIN_ACTOR);
    expect(service.cancel).toHaveBeenCalledWith(PAYROLL_ID, ADMIN_ACTOR);
  });

  it('csv sets Content-Type + attachment Content-Disposition and writes the body', async () => {
    const csv = 'header\nrow1\n';
    service.exportCsv.mockResolvedValue(csv);
    const res = makeRes();
    await controller.csv(
      { month: 5, year: 2026 },
      ADMIN_ACTOR,
      res as unknown as Parameters<PayrollController['csv']>[2],
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/csv; charset=utf-8',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="payroll-2026-05.csv"',
    );
    expect(res.send).toHaveBeenCalledWith(csv);
  });
});
