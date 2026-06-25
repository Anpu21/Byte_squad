/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { PurchaseReturnsService } from './purchase-returns.service';
import { PurchaseReturnsRepository } from './purchase-returns.repository';
import { GrnsRepository } from '@/modules/purchases-grn/grns.repository';
import { SupplierPaymentsRepository } from '@/modules/purchases-payments/supplier-payments.repository';
import { PurchaseDocNumberService } from '@/modules/purchases-doc-numbering/purchase-doc-number.service';
import { AccountingService } from '@accounting/accounting.service';
import { Grn } from '@/modules/purchases-grn/entities/grn.entity';
import { PurchaseReturn } from './entities/purchase-return.entity';
import { Inventory } from '@inventory/entities/inventory.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const SUPPLIER_ID = '33333333-3333-3333-3333-333333333333';
const PRODUCT_ID = '44444444-4444-4444-4444-444444444444';
const GRN_ID = '55555555-5555-5555-5555-555555555555';
const RETURN_ID = '77777777-7777-7777-7777-777777777777';
const MANAGER = { id: 'manager-1', role: UserRole.MANAGER, branchId: BRANCH_A };

function makeGrn(overrides: Partial<Grn> = {}): Grn {
  return {
    id: GRN_ID,
    grnNumber: 'GRN-2026-000001',
    supplierId: SUPPLIER_ID,
    supplier: { id: SUPPLIER_ID, name: 'Lanka Dairies' },
    branchId: BRANCH_A,
    grandTotal: 1200,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    status: 'Received',
    items: [
      {
        id: 'line-1',
        grnId: GRN_ID,
        productId: PRODUCT_ID,
        quantity: 10,
        unitCost: 120,
        lineTotal: 1200,
      },
    ],
    ...overrides,
  } as Grn;
}

const baseDto = {
  grnId: GRN_ID,
  reason: 'Damaged on arrival',
  items: [{ productId: PRODUCT_ID, quantity: 4 }],
};

describe('PurchaseReturnsService', () => {
  let service: PurchaseReturnsService;
  let returnsRepo: jest.Mocked<PurchaseReturnsRepository>;
  let grnsRepo: jest.Mocked<GrnsRepository>;
  let paymentsRepo: jest.Mocked<SupplierPaymentsRepository>;
  let accounting: jest.Mocked<AccountingService>;

  beforeEach(async () => {
    const dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb({} as unknown)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        PurchaseReturnsService,
        {
          provide: PurchaseReturnsRepository,
          useValue: {
            findById: jest.fn(),
            listForGrn: jest.fn(),
            sumReturnedByProduct: jest.fn().mockResolvedValue(new Map()),
            insertReturn: jest.fn(),
            insertReturnItem: jest.fn(),
          },
        },
        {
          provide: GrnsRepository,
          useValue: {
            findById: jest.fn(),
            lockInventoryRow: jest.fn(),
            setInventoryQuantity: jest.fn(),
            insertMovement: jest.fn(),
          },
        },
        {
          provide: SupplierPaymentsRepository,
          useValue: { lockGrn: jest.fn(), updateGrnPayment: jest.fn() },
        },
        {
          provide: AccountingService,
          useValue: { createLedgerEntryWithManager: jest.fn() },
        },
        {
          provide: PurchaseDocNumberService,
          useValue: { next: jest.fn().mockResolvedValue('PRET-2026-000001') },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(PurchaseReturnsService);
    returnsRepo = moduleRef.get(PurchaseReturnsRepository);
    grnsRepo = moduleRef.get(GrnsRepository);
    paymentsRepo = moduleRef.get(SupplierPaymentsRepository);
    accounting = moduleRef.get(AccountingService);
  });

  function primeHappyPath() {
    grnsRepo.findById.mockResolvedValue(makeGrn());
    returnsRepo.insertReturn.mockImplementation((_m, partial) =>
      Promise.resolve({
        id: RETURN_ID,
        ...(partial as object),
      } as PurchaseReturn),
    );
    grnsRepo.lockInventoryRow.mockResolvedValue({
      id: 'inv-1',
      quantity: 10,
    } as Inventory);
    paymentsRepo.lockGrn.mockResolvedValue(makeGrn());
    returnsRepo.findById.mockResolvedValue({
      id: RETURN_ID,
      returnNumber: 'PRET-2026-000001',
    } as PurchaseReturn);
  }

  it('returns stock, adjusts the bill, posts the CREDIT reversal', async () => {
    primeHappyPath();
    await service.create(baseDto, MANAGER);

    // 4 × 120 (GRN cost, not client-supplied) = 480
    expect(returnsRepo.insertReturn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ total: 480 }),
    );
    expect(grnsRepo.setInventoryQuantity).toHaveBeenCalledWith(
      expect.anything(),
      'inv-1',
      6,
    );
    expect(grnsRepo.insertMovement).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        movementType: 'Return',
        qtyOut: 4,
        balanceAfter: 6,
        refType: 'PurchaseReturn',
      }),
    );
    expect(paymentsRepo.updateGrnPayment).toHaveBeenCalledWith(
      expect.anything(),
      GRN_ID,
      480,
      'Partially_Paid',
    );
    expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entryType: LedgerEntryType.CREDIT,
        amount: 480,
      }),
    );
  });

  it('caps the quantity at received-minus-already-returned', async () => {
    primeHappyPath();
    returnsRepo.sumReturnedByProduct.mockResolvedValue(
      new Map([[PRODUCT_ID, 8]]),
    );
    await expect(service.create(baseDto, MANAGER)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects a product that is not on the GRN', async () => {
    primeHappyPath();
    await expect(
      service.create(
        {
          ...baseDto,
          items: [{ productId: BRANCH_B, quantity: 1 }],
        },
        MANAGER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses when the return exceeds the unpaid remainder', async () => {
    primeHappyPath();
    grnsRepo.findById.mockResolvedValue(
      makeGrn({ paidAmount: 1100, paymentStatus: 'Partially_Paid' }),
    );
    await expect(service.create(baseDto, MANAGER)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('refuses when on-hand stock is below the return quantity', async () => {
    primeHappyPath();
    grnsRepo.lockInventoryRow.mockResolvedValue({
      id: 'inv-1',
      quantity: 2,
    } as Inventory);
    await expect(service.create(baseDto, MANAGER)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('manager cannot return against another branch GRN', async () => {
    grnsRepo.findById.mockResolvedValue(makeGrn({ branchId: BRANCH_B }));
    await expect(service.create(baseDto, MANAGER)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
