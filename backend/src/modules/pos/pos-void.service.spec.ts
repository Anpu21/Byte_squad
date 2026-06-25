/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { EntityManager } from 'typeorm';

import { PosVoidService } from './pos-void.service';
import { SaleRepository } from './sale.repository';
import { PaymentRepository } from './payment.repository';
import { CreditTransactionRepository } from './credit-transaction.repository';
import { StockMovementRepository } from './stock-movement.repository';
import { AccountingService } from '@/modules/accounting-core/accounting.service';
import { LoyaltyWalletService } from '@/modules/loyalty-wallets/loyalty-wallet.service';
import { UserRole } from '@common/enums/user-roles.enums';
import { Sale } from './entities/sale.entity';
import type { ActorPayload } from './pos-write.service';

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function makeAdmin(overrides: Partial<ActorPayload> = {}): ActorPayload {
  return {
    id: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    branchId: 'branch-A',
    ...overrides,
  };
}

function makeManager(overrides: Partial<ActorPayload> = {}): ActorPayload {
  return {
    id: 'mgr-1',
    email: 'mgr@example.com',
    role: UserRole.MANAGER,
    branchId: 'branch-A',
    ...overrides,
  };
}

interface VoidItem {
  productId: string;
  baseUnitQty: number;
}

/**
 * Build a Sale row shaped for the void path (no `as unknown` casts in
 * the test bodies). All fields the service touches are set; the rest
 * stays undefined-by-design because the service ignores them.
 */
function makeSaleForVoid(opts: {
  id?: string;
  status?: 'Active' | 'Voided';
  branchId?: string;
  total?: number;
  customerUserId?: string | null;
  loyaltyCustomerId?: string | null;
  invoiceNumber?: string;
  items?: VoidItem[];
  location?: string;
}): Sale {
  return {
    id: opts.id ?? 'sale-void',
    invoiceNumber: opts.invoiceNumber ?? 'INV-2026-000050',
    status: opts.status ?? 'Active',
    branchId: opts.branchId ?? 'branch-A',
    total: opts.total ?? 100,
    customerUserId: opts.customerUserId ?? null,
    loyaltyCustomerId: opts.loyaltyCustomerId ?? null,
    location: opts.location ?? 'Shop',
    items: (opts.items ?? [{ productId: 'p-1', baseUnitQty: 2 }]).map((it) => ({
      productId: it.productId,
      baseUnitQty: it.baseUnitQty,
    })),
  } as unknown as Sale;
}

interface VoidMockBag {
  service: PosVoidService;
  sales: jest.Mocked<SaleRepository>;
  payments: jest.Mocked<PaymentRepository>;
  creditTransactions: jest.Mocked<CreditTransactionRepository>;
  stockMovements: jest.Mocked<StockMovementRepository>;
  accounting: { createLedgerEntryWithManager: jest.Mock };
  loyaltyWallet: { reverseOrderEffects: jest.Mock };
  managerCalls: {
    invSave: jest.Mock;
    invFindOne: jest.Mock;
    userFindOne: jest.Mock;
    userUpdate: jest.Mock;
  };
}

/**
 * Mock factory tailored to PosVoidService. The dataSource.transaction
 * mock just runs the callback with a fake EntityManager whose
 * getRepository dispatches on entity name (Inventory + User).
 */
function buildVoidMocks(opts: {
  inventoryByProduct?: Map<string, { productId: string; quantity: number }>;
  userRows?: Map<string, { id: string; currentBalance: number }>;
}): Promise<VoidMockBag> {
  const invMap =
    opts.inventoryByProduct ??
    new Map([
      ['p-1', { productId: 'p-1', quantity: 10 }],
      ['p-2', { productId: 'p-2', quantity: 5 }],
    ]);
  const users = opts.userRows ?? new Map();

  // The locked select-for-update path: `.where(...)` stashes params,
  // `.getOne()` resolves with the inventory row matching the params.
  let lastQbParams: { p?: string; b?: string } = {};
  const invQbGetOne = jest
    .fn<Promise<{ productId: string; quantity: number } | null>, []>()
    .mockImplementation(() =>
      Promise.resolve(invMap.get(lastQbParams.p ?? '') ?? null),
    );
  const fakeQb = {
    setLock: jest.fn().mockReturnThis(),
    where: jest
      .fn()
      .mockImplementation(
        (_clause: string, params: { p: string; b: string }) => {
          lastQbParams = params;
          return fakeQb;
        },
      ),
    getOne: invQbGetOne,
  };

  const invSave = jest
    .fn()
    .mockImplementation((row: { productId: string; quantity: number }) => {
      invMap.set(row.productId, row);
      return Promise.resolve(row);
    });
  const invFindOne = jest
    .fn()
    .mockImplementation(
      ({ where }: { where: { productId: string; branchId: string } }) => {
        return Promise.resolve(invMap.get(where.productId) ?? null);
      },
    );

  const userFindOne = jest
    .fn()
    .mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve(users.get(where.id) ?? null),
    );
  const userUpdate = jest.fn().mockResolvedValue({ affected: 1 });

  const manager = {
    getRepository: jest.fn().mockImplementation((entity: { name: string }) => {
      const name = entity.name;
      if (name === 'Inventory') {
        return {
          createQueryBuilder: jest.fn(() => fakeQb),
          findOne: invFindOne,
          save: invSave,
        };
      }
      if (name === 'User') {
        return { findOne: userFindOne, update: userUpdate };
      }
      return {};
    }),
  };

  const dataSourceMock = {
    transaction: jest
      .fn()
      .mockImplementation(async (cb: (m: typeof manager) => Promise<unknown>) =>
        cb(manager),
      ),
  } as unknown as jest.Mocked<DataSource>;

  const salesRepoMock: Partial<jest.Mocked<SaleRepository>> = {
    findOneById: jest.fn(),
    voidById: jest.fn().mockResolvedValue(undefined),
  };
  const paymentsRepoMock: Partial<jest.Mocked<PaymentRepository>> = {
    voidBySaleId: jest.fn().mockResolvedValue(undefined),
  };
  const creditTxnsRepoMock: Partial<jest.Mocked<CreditTransactionRepository>> =
    {
      findBySaleId: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
    };
  const stockMovementsRepoMock: Partial<jest.Mocked<StockMovementRepository>> =
    {
      create: jest.fn().mockResolvedValue({}),
    };
  const accountingMock = {
    createLedgerEntryWithManager: jest.fn().mockResolvedValue({ id: 'le-2' }),
  };
  const loyaltyWalletMock = {
    reverseOrderEffects: jest
      .fn()
      .mockResolvedValue({ earnedReversed: 0, redeemedRestored: 0 }),
  };

  return Test.createTestingModule({
    providers: [
      PosVoidService,
      { provide: SaleRepository, useValue: salesRepoMock },
      { provide: PaymentRepository, useValue: paymentsRepoMock },
      { provide: CreditTransactionRepository, useValue: creditTxnsRepoMock },
      { provide: StockMovementRepository, useValue: stockMovementsRepoMock },
      { provide: AccountingService, useValue: accountingMock },
      { provide: LoyaltyWalletService, useValue: loyaltyWalletMock },
      { provide: DataSource, useValue: dataSourceMock },
    ],
  })
    .compile()
    .then((module) => ({
      service: module.get(PosVoidService),
      sales: module.get(SaleRepository),
      payments: module.get(PaymentRepository),
      creditTransactions: module.get(CreditTransactionRepository),
      stockMovements: module.get(StockMovementRepository),
      accounting: accountingMock,
      loyaltyWallet: loyaltyWalletMock,
      managerCalls: {
        invSave,
        invFindOne,
        userFindOne,
        userUpdate,
      },
    }));
}

// ---------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------

describe('PosVoidService.voidSale', () => {
  it('happy path: flips status to Voided, restocks inventory, writes Sale_Voided + DEBIT ledger', async () => {
    const original = makeSaleForVoid({
      id: 'sale-1',
      branchId: 'branch-A',
      total: 100,
      items: [{ productId: 'p-1', baseUnitQty: 2 }],
    });
    const refreshed = makeSaleForVoid({
      id: 'sale-1',
      status: 'Voided',
      branchId: 'branch-A',
      total: 100,
      items: [{ productId: 'p-1', baseUnitQty: 2 }],
    });
    const bag = await buildVoidMocks({
      inventoryByProduct: new Map([['p-1', { productId: 'p-1', quantity: 8 }]]),
    });
    bag.sales.findOneById
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(refreshed);

    const result = await bag.service.voidSale(
      makeAdmin(),
      'sale-1',
      'damaged on the floor',
    );

    expect(bag.sales.voidById).toHaveBeenCalledWith(
      'sale-1',
      'admin-1',
      'damaged on the floor',
      expect.anything(),
    );
    // Inventory increment: 8 + 2 = 10
    expect(bag.managerCalls.invSave).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p-1', quantity: 10 }),
    );
    expect(bag.stockMovements.create).toHaveBeenCalledWith(
      expect.objectContaining({
        movementType: 'Sale_Voided',
        qtyIn: 2,
        qtyOut: 0,
        refType: 'Sale',
        refId: 'sale-1',
      }),
      expect.anything(),
    );
    expect(bag.accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        amount: 100,
        entryType: 'debit',
        referenceNumber: 'INV-2026-000050',
        saleId: 'sale-1',
      }),
    );
    const managerMatcher = expect.anything() as unknown as EntityManager;

    expect(bag.loyaltyWallet.reverseOrderEffects).toHaveBeenCalledWith({
      owner: null,
      orderId: 'sale-1',
      orderCode: 'INV-2026-000050',
      branchId: 'branch-A',
      manager: managerMatcher,
    });
    expect(bag.payments.voidBySaleId).toHaveBeenCalledWith(
      'sale-1',
      expect.anything(),
    );
    expect(result).toBe(refreshed);
  });

  it('throws ConflictException when the sale is already voided', async () => {
    const bag = await buildVoidMocks({});
    bag.sales.findOneById.mockResolvedValue(
      makeSaleForVoid({ id: 'sale-2', status: 'Voided' }),
    );

    await expect(
      bag.service.voidSale(makeAdmin(), 'sale-2', 'duplicate void'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(bag.sales.voidById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when a manager targets a sale on another branch', async () => {
    const bag = await buildVoidMocks({});
    bag.sales.findOneById.mockResolvedValue(
      makeSaleForVoid({ id: 'sale-x', branchId: 'branch-B' }),
    );

    await expect(
      bag.service.voidSale(
        makeManager({ branchId: 'branch-A' }),
        'sale-x',
        'cross branch',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(bag.sales.voidById).not.toHaveBeenCalled();
  });

  it('restocks every item: 2 items → 2 inventory saves + 2 stock_movements rows', async () => {
    const original = makeSaleForVoid({
      id: 'sale-multi',
      branchId: 'branch-A',
      total: 250,
      items: [
        { productId: 'p-1', baseUnitQty: 2 },
        { productId: 'p-2', baseUnitQty: 1 },
      ],
    });
    const bag = await buildVoidMocks({
      inventoryByProduct: new Map([
        ['p-1', { productId: 'p-1', quantity: 8 }],
        ['p-2', { productId: 'p-2', quantity: 9 }],
      ]),
    });
    bag.sales.findOneById
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(original);

    await bag.service.voidSale(makeAdmin(), 'sale-multi', 'reason here');

    expect(bag.managerCalls.invSave).toHaveBeenCalledTimes(2);
    expect(bag.managerCalls.invSave).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p-1', quantity: 10 }),
    );
    expect(bag.managerCalls.invSave).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p-2', quantity: 10 }),
    );
    expect(bag.stockMovements.create).toHaveBeenCalledTimes(2);
  });

  it('reverses loyalty against the stored walk-in owner when voiding a POS loyalty sale', async () => {
    const original = makeSaleForVoid({
      id: 'sale-loyalty',
      branchId: 'branch-A',
      loyaltyCustomerId: 'walkin-1',
      items: [{ productId: 'p-1', baseUnitQty: 1 }],
    });
    const bag = await buildVoidMocks({
      inventoryByProduct: new Map([['p-1', { productId: 'p-1', quantity: 5 }]]),
    });
    bag.sales.findOneById
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(original);

    await bag.service.voidSale(makeAdmin(), 'sale-loyalty', 'customer return');

    const managerMatcher = expect.anything() as unknown as EntityManager;

    expect(bag.loyaltyWallet.reverseOrderEffects).toHaveBeenCalledWith({
      owner: { loyaltyCustomerId: 'walkin-1' },
      orderId: 'sale-loyalty',
      orderCode: 'INV-2026-000050',
      branchId: 'branch-A',
      manager: managerMatcher,
    });
  });

  it('writes the DEBIT ledger entry equal to the original sale total', async () => {
    const original = makeSaleForVoid({
      id: 'sale-ledger',
      branchId: 'branch-A',
      total: 425.5,
      invoiceNumber: 'INV-2026-000099',
      items: [{ productId: 'p-1', baseUnitQty: 1 }],
    });
    const bag = await buildVoidMocks({
      inventoryByProduct: new Map([['p-1', { productId: 'p-1', quantity: 5 }]]),
    });
    bag.sales.findOneById
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(original);

    await bag.service.voidSale(makeAdmin(), 'sale-ledger', 'cancel me');

    expect(bag.accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entryType: 'debit',
        amount: 425.5,
        referenceNumber: 'INV-2026-000099',
        saleId: 'sale-ledger',
        description: expect.stringContaining(
          'Voided POS Sale — INV-2026-000099',
        ) as string,
      }),
    );
  });

  it('reverses a Credit_Taken: inserts a Credit_Paid row and decreases user.currentBalance', async () => {
    const original = makeSaleForVoid({
      id: 'sale-credit',
      branchId: 'branch-A',
      total: 100,
      customerUserId: 'cust-1',
      items: [{ productId: 'p-1', baseUnitQty: 1 }],
    });
    const bag = await buildVoidMocks({
      inventoryByProduct: new Map([['p-1', { productId: 'p-1', quantity: 5 }]]),
      userRows: new Map([['cust-1', { id: 'cust-1', currentBalance: 150 }]]),
    });
    bag.creditTransactions.findBySaleId.mockResolvedValue([
      {
        id: 'ct-abc1234',
        userId: 'cust-1',
        saleId: 'sale-credit',
        transactionType: 'Credit_Taken',
        amount: 100,
        runningBalance: 150,
        referenceNo: 'CR-INV-2026-000050',
        notes: null,
        createdAt: new Date('2026-05-22T10:00:00Z'),
      } as never,
    ]);
    bag.sales.findOneById
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce(original);

    await bag.service.voidSale(makeAdmin(), 'sale-credit', 'mistake');

    expect(bag.creditTransactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'cust-1',
        saleId: 'sale-credit',
        transactionType: 'Credit_Paid',
        amount: 100,
        runningBalance: 50,
        referenceNo: expect.stringContaining('VOID-INV-2026-000050') as string,
      }),
      expect.anything(),
    );
    expect(bag.managerCalls.userUpdate).toHaveBeenCalledWith('cust-1', {
      currentBalance: 50,
    });
  });
});
