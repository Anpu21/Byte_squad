/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { GrnsService } from './grns.service';
import { GrnsRepository } from './grns.repository';
import { PurchaseDocNumberService } from './purchase-doc-number.service';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { AccountingService } from '@accounting/accounting.service';
import { ACCOUNT_CODES } from '@accounting/types/account-code.type';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { SuppliersRepository } from '@/modules/suppliers/suppliers.repository';
import { Supplier } from '@/modules/suppliers/entities/supplier.entity';
import { Grn } from './entities/grn.entity';
import { Product } from '@products/entities/product.entity';
import { Inventory } from '@inventory/entities/inventory.entity';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const SUPPLIER_ID = '33333333-3333-3333-3333-333333333333';
const PRODUCT_ID = '44444444-4444-4444-4444-444444444444';
const GRN_ID = '55555555-5555-5555-5555-555555555555';
const ADMIN = { id: 'admin-1', role: UserRole.ADMIN, branchId: null };
const MANAGER = { id: 'manager-1', role: UserRole.MANAGER, branchId: BRANCH_A };

function makeSupplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: SUPPLIER_ID,
    name: 'Lanka Dairies',
    status: 'Active',
    creditTermDays: 30,
    openingBalance: 0,
    ...overrides,
  } as Supplier;
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: PRODUCT_ID,
    name: 'Anchor Milk 1L',
    costPrice: 100,
    isActive: true,
    ...overrides,
  } as Product;
}

function makeGrn(overrides: Partial<Grn> = {}): Grn {
  return {
    id: GRN_ID,
    grnNumber: 'GRN-2026-000001',
    supplierId: SUPPLIER_ID,
    branchId: BRANCH_A,
    grnDate: '2026-06-10',
    dueDate: '2026-07-10',
    subTotal: 1200,
    discountAmount: 0,
    grandTotal: 1200,
    paidAmount: 0,
    paymentStatus: 'Unpaid',
    status: 'Received',
    items: [],
    createdByUserId: MANAGER.id,
    ...overrides,
  } as Grn;
}

const baseDto = {
  supplierId: SUPPLIER_ID,
  grnDate: '2026-06-10',
  items: [{ productId: PRODUCT_ID, quantity: 10, unitCost: 120 }],
};

describe('GrnsService', () => {
  let service: GrnsService;
  let repo: jest.Mocked<GrnsRepository>;
  let suppliers: jest.Mocked<SuppliersRepository>;
  let orders: jest.Mocked<PurchaseOrdersRepository>;
  let accounting: jest.Mocked<AccountingService>;
  let docNumbers: jest.Mocked<PurchaseDocNumberService>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb({} as unknown)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        GrnsService,
        {
          provide: GrnsRepository,
          useValue: {
            findById: jest.fn(),
            list: jest.fn(),
            findProductsByIds: jest.fn(),
            insertGrn: jest.fn(),
            updateGrn: jest.fn(),
            insertGrnItem: jest.fn(),
            lockInventoryRow: jest.fn(),
            setInventoryQuantity: jest.fn(),
            sumOnHandAllBranches: jest.fn(),
            lockProduct: jest.fn(),
            updateProductCost: jest.fn(),
            insertBatch: jest.fn(),
            zeroBatchesByNote: jest.fn(),
            insertMovement: jest.fn(),
          },
        },
        {
          provide: SuppliersRepository,
          useValue: { findById: jest.fn() },
        },
        {
          provide: PurchaseOrdersRepository,
          useValue: { findById: jest.fn(), updateStatus: jest.fn() },
        },
        {
          provide: AccountingService,
          useValue: { createLedgerEntryWithManager: jest.fn() },
        },
        {
          provide: PurchaseDocNumberService,
          useValue: { next: jest.fn() },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(GrnsService);
    repo = moduleRef.get(GrnsRepository);
    suppliers = moduleRef.get(SuppliersRepository);
    orders = moduleRef.get(PurchaseOrdersRepository);
    accounting = moduleRef.get(AccountingService);
    docNumbers = moduleRef.get(PurchaseDocNumberService);
  });

  function primeHappyPath() {
    suppliers.findById.mockResolvedValue(makeSupplier());
    repo.findProductsByIds.mockResolvedValue([makeProduct()]);
    docNumbers.next.mockResolvedValue('GRN-2026-000001');
    repo.insertGrn.mockImplementation((_m, partial) =>
      Promise.resolve(makeGrn(partial as Partial<Grn>)),
    );
    repo.lockProduct.mockResolvedValue(makeProduct());
    repo.sumOnHandAllBranches.mockResolvedValue(40);
    repo.lockInventoryRow.mockResolvedValue({
      id: 'inv-1',
      productId: PRODUCT_ID,
      branchId: BRANCH_A,
      quantity: 25,
    } as Inventory);
    repo.findById.mockResolvedValue(makeGrn());
  }

  describe('create', () => {
    it('manager receives into their own branch with full side-effects', async () => {
      primeHappyPath();
      await service.create(baseDto, MANAGER);

      expect(repo.insertGrn).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          branchId: BRANCH_A,
          subTotal: 1200,
          grandTotal: 1200,
          // 2026-06-10 + 30-day terms
          dueDate: '2026-07-10',
          paymentStatus: 'Unpaid',
        }),
      );
      // Weighted average: (40×100 + 10×120) / 50 = 104
      expect(repo.updateProductCost).toHaveBeenCalledWith(
        expect.anything(),
        PRODUCT_ID,
        104,
      );
      // Stock in: 25 + 10 = 35
      expect(repo.setInventoryQuantity).toHaveBeenCalledWith(
        expect.anything(),
        'inv-1',
        35,
        expect.any(Date),
      );
      expect(repo.insertMovement).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          movementType: 'Purchase',
          qtyIn: 10,
          qtyOut: 0,
          balanceAfter: 35,
          refType: 'GRN',
        }),
      );
      expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entryType: LedgerEntryType.DEBIT,
          amount: 1200,
          referenceNumber: 'GRN-2026-000001',
          accountCode: ACCOUNT_CODES.INVENTORY,
        }),
      );
      // No batch/expiry on the line → no batch row.
      expect(repo.insertBatch).not.toHaveBeenCalled();
    });

    it('records a batch row when batchNo/expiry is given', async () => {
      primeHappyPath();
      await service.create(
        {
          ...baseDto,
          items: [
            {
              productId: PRODUCT_ID,
              quantity: 10,
              unitCost: 120,
              batchNo: 'LOT-9',
              expiryDate: '2026-12-01',
            },
          ],
        },
        MANAGER,
      );
      expect(repo.insertBatch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          batchNo: 'LOT-9',
          expiryDate: '2026-12-01',
          quantity: 10,
          notes: 'GRN-2026-000001',
        }),
      );
    });

    it('admin must name the receiving branch', async () => {
      await expect(service.create(baseDto, ADMIN)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('manager cannot receive into another branch', async () => {
      await expect(
        service.create({ ...baseDto, branchId: BRANCH_B }, MANAGER),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an inactive supplier', async () => {
      suppliers.findById.mockResolvedValue(
        makeSupplier({ status: 'Inactive' }),
      );
      await expect(service.create(baseDto, MANAGER)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects an unknown product', async () => {
      suppliers.findById.mockResolvedValue(makeSupplier());
      repo.findProductsByIds.mockResolvedValue([]);
      await expect(service.create(baseDto, MANAGER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a discount larger than the subtotal', async () => {
      suppliers.findById.mockResolvedValue(makeSupplier());
      repo.findProductsByIds.mockResolvedValue([makeProduct()]);
      await expect(
        service.create({ ...baseDto, discountAmount: 5000 }, MANAGER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('converting a PO marks it Received inside the txn', async () => {
      primeHappyPath();
      orders.findById.mockResolvedValue({
        id: 'po-1',
        poNumber: 'PO-2026-000001',
        supplierId: SUPPLIER_ID,
        branchId: BRANCH_A,
        status: 'Sent',
      } as PurchaseOrder);
      await service.create({ ...baseDto, purchaseOrderId: 'po-1' }, MANAGER);
      expect(orders.updateStatus).toHaveBeenCalledWith(
        'po-1',
        'Received',
        expect.anything(),
      );
    });

    it('refuses to receive a cancelled PO', async () => {
      primeHappyPath();
      orders.findById.mockResolvedValue({
        id: 'po-1',
        poNumber: 'PO-2026-000001',
        supplierId: SUPPLIER_ID,
        branchId: BRANCH_A,
        status: 'Cancelled',
      } as PurchaseOrder);
      await expect(
        service.create({ ...baseDto, purchaseOrderId: 'po-1' }, MANAGER),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('keeps costPrice when the basis is empty and costs match', async () => {
      primeHappyPath();
      repo.sumOnHandAllBranches.mockResolvedValue(0);
      repo.lockProduct.mockResolvedValue(makeProduct({ costPrice: 120 }));
      await service.create(baseDto, MANAGER);
      // (0×120 + 10×120)/10 = 120 → unchanged, no write.
      expect(repo.updateProductCost).not.toHaveBeenCalled();
    });
  });

  describe('void', () => {
    it('admin voids: stock out, batches zeroed, CREDIT reversal', async () => {
      const grn = makeGrn({
        items: [
          {
            id: 'line-1',
            grnId: GRN_ID,
            productId: PRODUCT_ID,
            quantity: 10,
            unitCost: 120,
            lineTotal: 1200,
            product: makeProduct(),
          },
        ] as Grn['items'],
      });
      repo.findById
        .mockResolvedValueOnce(grn)
        .mockResolvedValueOnce(makeGrn({ status: 'Voided' }));
      repo.lockInventoryRow.mockResolvedValue({
        id: 'inv-1',
        quantity: 35,
      } as Inventory);

      const result = await service.void(
        GRN_ID,
        { reason: 'Wrong delivery' },
        ADMIN,
      );

      expect(repo.setInventoryQuantity).toHaveBeenCalledWith(
        expect.anything(),
        'inv-1',
        25,
      );
      expect(repo.zeroBatchesByNote).toHaveBeenCalledWith(
        expect.anything(),
        'GRN-2026-000001',
      );
      expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          entryType: LedgerEntryType.CREDIT,
          accountCode: ACCOUNT_CODES.INVENTORY,
        }),
      );
      expect(result.status).toBe('Voided');
    });

    it('refuses when received stock was already consumed', async () => {
      repo.findById.mockResolvedValue(
        makeGrn({
          items: [
            {
              id: 'line-1',
              grnId: GRN_ID,
              productId: PRODUCT_ID,
              quantity: 10,
              unitCost: 120,
              lineTotal: 1200,
              product: makeProduct(),
            },
          ] as Grn['items'],
        }),
      );
      repo.lockInventoryRow.mockResolvedValue({
        id: 'inv-1',
        quantity: 4,
      } as Inventory);
      await expect(
        service.void(GRN_ID, { reason: 'Wrong delivery' }, ADMIN),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses once payments are allocated', async () => {
      repo.findById.mockResolvedValue(makeGrn({ paidAmount: 500 }));
      await expect(
        service.void(GRN_ID, { reason: 'dup' }, ADMIN),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('scoping', () => {
    it('manager list is pinned to their branch', async () => {
      repo.list.mockResolvedValue({ rows: [], total: 0 });
      await service.list({ branchId: BRANCH_B }, MANAGER);
      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A }),
      );
    });

    it('manager cannot read another branch GRN', async () => {
      repo.findById.mockResolvedValue(makeGrn({ branchId: BRANCH_B }));
      await expect(service.getById(GRN_ID, MANAGER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
