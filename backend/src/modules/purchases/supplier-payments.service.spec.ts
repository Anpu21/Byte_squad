/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { SupplierPaymentsService } from './supplier-payments.service';
import { SupplierPaymentsRepository } from './supplier-payments.repository';
import { PurchaseDocNumberService } from './purchase-doc-number.service';
import { SuppliersRepository } from '@/modules/suppliers/suppliers.repository';
import { Supplier } from '@/modules/suppliers/entities/supplier.entity';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { Grn } from './entities/grn.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const SUPPLIER_ID = '33333333-3333-3333-3333-333333333333';
const GRN_ID = '55555555-5555-5555-5555-555555555555';
const PAYMENT_ID = '66666666-6666-6666-6666-666666666666';
const MANAGER = { id: 'manager-1', role: UserRole.MANAGER, branchId: BRANCH_A };

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: SUPPLIER_ID,
    name: 'Lanka Dairies',
    status: 'Active',
    creditTermDays: 30,
    openingBalance: 1000,
    ...overrides,
  } as Supplier;
}

function makeGrn(overrides: Partial<Grn> = {}): Grn {
  return {
    id: GRN_ID,
    grnNumber: 'GRN-2026-000001',
    supplierId: SUPPLIER_ID,
    branchId: BRANCH_A,
    grandTotal: 1200,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    status: 'Received',
    ...overrides,
  } as Grn;
}

function makePayment(
  overrides: Partial<SupplierPayment> = {},
): SupplierPayment {
  return {
    id: PAYMENT_ID,
    paymentNumber: 'SPAY-2026-000001',
    supplierId: SUPPLIER_ID,
    branchId: BRANCH_A,
    method: 'Cash',
    amount: 500,
    paidAt: '2026-06-10',
    allocations: [],
    ...overrides,
  } as SupplierPayment;
}

describe('SupplierPaymentsService', () => {
  let service: SupplierPaymentsService;
  let repo: jest.Mocked<SupplierPaymentsRepository>;
  let suppliers: jest.Mocked<SuppliersRepository>;

  beforeEach(async () => {
    const dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb({} as unknown)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        SupplierPaymentsService,
        {
          provide: SupplierPaymentsRepository,
          useValue: {
            findById: jest.fn(),
            list: jest.fn(),
            sumOpeningAllocations: jest.fn(),
            insertPayment: jest.fn(),
            insertAllocation: jest.fn(),
            lockGrn: jest.fn(),
            updateGrnPayment: jest.fn(),
          },
        },
        { provide: SuppliersRepository, useValue: { findById: jest.fn() } },
        {
          provide: PurchaseDocNumberService,
          useValue: { next: jest.fn().mockResolvedValue('SPAY-2026-000001') },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(SupplierPaymentsService);
    repo = moduleRef.get(SupplierPaymentsRepository);
    suppliers = moduleRef.get(SuppliersRepository);
  });

  it('settles a bill partially and marks it Partially_Paid', async () => {
    suppliers.findById.mockResolvedValue(makeSupplier());
    repo.insertPayment.mockResolvedValue(makePayment());
    repo.lockGrn.mockResolvedValue(makeGrn());
    repo.findById.mockResolvedValue(makePayment());

    await service.create(
      {
        supplierId: SUPPLIER_ID,
        method: 'Cash',
        amount: 500,
        allocations: [{ grnId: GRN_ID, amount: 500 }],
      },
      MANAGER,
    );

    expect(repo.updateGrnPayment).toHaveBeenCalledWith(
      expect.anything(),
      GRN_ID,
      500,
      'Partially_Paid',
    );
    expect(repo.insertAllocation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ grnId: GRN_ID, amount: 500 }),
    );
  });

  it('marks the bill Paid when fully settled', async () => {
    suppliers.findById.mockResolvedValue(makeSupplier());
    repo.insertPayment.mockResolvedValue(makePayment({ amount: 1200 }));
    repo.lockGrn.mockResolvedValue(makeGrn());
    repo.findById.mockResolvedValue(makePayment());

    await service.create(
      {
        supplierId: SUPPLIER_ID,
        method: 'Card',
        amount: 1200,
        allocations: [{ grnId: GRN_ID, amount: 1200 }],
      },
      MANAGER,
    );

    expect(repo.updateGrnPayment).toHaveBeenCalledWith(
      expect.anything(),
      GRN_ID,
      1200,
      'Paid',
    );
  });

  it('rejects allocations that do not sum to the amount', async () => {
    suppliers.findById.mockResolvedValue(makeSupplier());
    await expect(
      service.create(
        {
          supplierId: SUPPLIER_ID,
          method: 'Cash',
          amount: 500,
          allocations: [{ grnId: GRN_ID, amount: 300 }],
        },
        MANAGER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects over-allocation beyond the bill remainder', async () => {
    suppliers.findById.mockResolvedValue(makeSupplier());
    repo.insertPayment.mockResolvedValue(makePayment());
    repo.lockGrn.mockResolvedValue(
      makeGrn({ paidAmount: 1000, paymentStatus: 'Partially_Paid' }),
    );
    await expect(
      service.create(
        {
          supplierId: SUPPLIER_ID,
          method: 'Cash',
          amount: 500,
          allocations: [{ grnId: GRN_ID, amount: 500 }],
        },
        MANAGER,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects paying a voided bill', async () => {
    suppliers.findById.mockResolvedValue(makeSupplier());
    repo.insertPayment.mockResolvedValue(makePayment());
    repo.lockGrn.mockResolvedValue(makeGrn({ status: 'Voided' }));
    await expect(
      service.create(
        {
          supplierId: SUPPLIER_ID,
          method: 'Cash',
          amount: 500,
          allocations: [{ grnId: GRN_ID, amount: 500 }],
        },
        MANAGER,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('caps opening-balance slices at the unsettled remainder', async () => {
    suppliers.findById.mockResolvedValue(
      makeSupplier({ openingBalance: 1000 }),
    );
    repo.insertPayment.mockResolvedValue(makePayment());
    repo.sumOpeningAllocations.mockResolvedValue(900);
    await expect(
      service.create(
        {
          supplierId: SUPPLIER_ID,
          method: 'Cash',
          amount: 200,
          allocations: [{ amount: 200 }],
        },
        MANAGER,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('accepts an opening-balance slice within the remainder', async () => {
    suppliers.findById.mockResolvedValue(
      makeSupplier({ openingBalance: 1000 }),
    );
    repo.insertPayment.mockResolvedValue(makePayment());
    repo.sumOpeningAllocations.mockResolvedValue(900);
    repo.findById.mockResolvedValue(makePayment());

    await service.create(
      {
        supplierId: SUPPLIER_ID,
        method: 'Cash',
        amount: 100,
        allocations: [{ amount: 100 }],
      },
      MANAGER,
    );
    expect(repo.insertAllocation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ grnId: null, amount: 100 }),
    );
  });

  it('404s on an unknown supplier', async () => {
    suppliers.findById.mockResolvedValue(null);
    await expect(
      service.create(
        {
          supplierId: SUPPLIER_ID,
          method: 'Cash',
          amount: 100,
          allocations: [{ amount: 100 }],
        },
        MANAGER,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
