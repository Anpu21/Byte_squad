/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';

import { PosWriteService, type ActorPayload } from './pos-write.service';
import { PosRepository } from './pos.repository';
import { SaleRepository } from './sale.repository';
import { SaleItemRepository } from './sale-item.repository';
import { PaymentRepository } from './payment.repository';
import { CreditTransactionRepository } from './credit-transaction.repository';
import { StockMovementRepository } from './stock-movement.repository';
import { InvoiceNumberService } from './services/invoice-number.service';
import { MultiTenderCalculatorService } from './services/multi-tender-calculator.service';
import { ProductsRepository } from '@products/products.repository';
import { AccountingService } from '@accounting/accounting.service';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { LoyaltyWalletService } from '@/modules/loyalty/loyalty-wallet.service';
import { UserRole } from '@common/enums/user-roles.enums';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './entities/sale.entity';

// ---------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------

function makeCashier(overrides: Partial<ActorPayload> = {}): ActorPayload {
  return {
    id: 'cashier-1',
    email: 'cashier@example.com',
    role: UserRole.CASHIER,
    branchId: 'branch-A',
    ...overrides,
  };
}

function makeDto(overrides: Partial<CreateSaleDto> = {}): CreateSaleDto {
  return {
    saleType: 'Retail',
    priceLevel: 'Retail',
    items: [
      {
        productId: 'p-1',
        quantity: 1,
        unitPrice: 100,
      },
    ],
    payment: {
      paymentMethod: 'Cash',
      paymentAmount: 100,
      cashAmount: 100,
      cashTendered: 100,
    },
    ...overrides,
  };
}

/**
 * Builder for the in-memory inventory rows returned by the locked query
 * builder. Tests mutate this so we can model "stock decreases as items are
 * processed" without re-mocking on every line.
 */
function makeInvRow(productId: string, qty: number) {
  return { productId, branchId: 'branch-A', quantity: qty };
}

// ---------------------------------------------------------------------
// Mock factories — kept inside the file so each describe gets a fresh
// instance. The DataSource mock owns its own transaction() that just runs
// the callback with the same `manager` mock.
// ---------------------------------------------------------------------

interface MockBag {
  service: PosWriteService;
  pos: jest.Mocked<PosRepository>;
  sales: jest.Mocked<SaleRepository>;
  saleItems: jest.Mocked<SaleItemRepository>;
  payments: jest.Mocked<PaymentRepository>;
  creditTransactions: jest.Mocked<CreditTransactionRepository>;
  stockMovements: jest.Mocked<StockMovementRepository>;
  invoiceNumbers: jest.Mocked<InvoiceNumberService>;
  multiTender: MultiTenderCalculatorService;
  products: jest.Mocked<ProductsRepository>;
  accounting: { createLedgerEntryWithManager: jest.Mock };
  loyalty: {
    getOrCreateAccount: jest.Mock;
    getPointValue: jest.Mock;
  };
  loyaltyWallet: {
    awardForOrder: jest.Mock;
    redeemForOrder: jest.Mock;
  };
  dataSource: jest.Mocked<DataSource>;
  managerCalls: {
    invSave: jest.Mock;
    invFindOne: jest.Mock;
    invQbGetOne: jest.Mock;
    invLockSpy: jest.Mock;
    unitFindByIds: jest.Mock;
    userFindOne: jest.Mock;
    userUpdate: jest.Mock;
  };
  inventoryRows: ReturnType<typeof makeInvRow>[];
}

interface LoyaltyMockOptions {
  pointsBalance?: number;
  pointValue?: number;
  earnedPoints?: number;
  redeemedPoints?: number;
  redeemError?: Error;
}

function buildMocks(
  opts: {
    inventoryRows?: ReturnType<typeof makeInvRow>[];
    unitsById?: Map<
      string,
      {
        id: string;
        productId: string;
        conversionToBase: number;
        sellingPrice: number;
      }
    >;
    productPrices?: Map<string, number>;
    userRows?: Map<string, { id: string; currentBalance: number }>;
    loyalty?: LoyaltyMockOptions;
  } = {},
): Promise<MockBag> {
  const inventoryRows = opts.inventoryRows ?? [makeInvRow('p-1', 50)];
  const unitsArr = Array.from(opts.unitsById?.values() ?? []);
  const productPrices =
    opts.productPrices ??
    new Map([
      ['p-1', 100],
      ['p-2', 50],
    ]);
  const users = opts.userRows ?? new Map();

  // Inventory operations — locked findOne pulls a row, findOne (post-deduct)
  // re-reads the same row from the array.
  const invLockSpy = jest.fn();
  const invQbGetOne = jest.fn(() => {
    // We return the most-recent state by index; callers track which item
    // they're on via a separate counter — but the simpler model is "find
    // by productId + branchId" because tests rarely test the same product
    // twice on one sale.
    const next = inventoryRows.shift();
    return Promise.resolve(next ?? null);
  });
  const invSave = jest
    .fn()
    .mockImplementation((row: { productId: string; quantity: number }) => {
      // Push the modified row back so the post-deduct findOne can locate it.
      postDecrementRows.set(row.productId, row);
      return Promise.resolve(row);
    });
  const postDecrementRows = new Map<
    string,
    { productId: string; quantity: number }
  >();
  const invFindOne = jest
    .fn()
    .mockImplementation(({ where }: { where: { productId: string } }) => {
      return Promise.resolve(postDecrementRows.get(where.productId) ?? null);
    });

  const unitFindByIds = jest.fn().mockResolvedValue(unitsArr);
  const userFindOne = jest
    .fn()
    .mockImplementation(({ where }: { where: { id: string } }) => {
      return Promise.resolve(users.get(where.id) ?? null);
    });
  const userUpdate = jest.fn().mockResolvedValue({ affected: 1 });

  // The "manager" returned by dataSource.transaction(cb) — getRepository
  // dispatches on the entity name so the same mock can serve Inventory,
  // ProductSellableUnit, and User reads.
  const fakeQb = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: invQbGetOne,
  };
  invLockSpy.mockImplementation(() => fakeQb);

  const manager = {
    getRepository: jest.fn().mockImplementation((entity: { name: string }) => {
      const name =
        typeof entity === 'function'
          ? entity.name
          : (entity as { name: string }).name;
      if (name === 'Inventory') {
        return {
          createQueryBuilder: invLockSpy,
          findOne: invFindOne,
          save: invSave,
        };
      }
      if (name === 'User') {
        return {
          findOne: userFindOne,
          update: userUpdate,
        };
      }
      return {};
    }),
  };

  const dataSourceMock = {
    getRepository: jest.fn().mockImplementation((entity: { name: string }) => {
      if (entity.name === 'ProductSellableUnit') {
        return { findByIds: unitFindByIds };
      }
      return {};
    }),
    transaction: jest
      .fn()
      .mockImplementation(async (cb: (m: typeof manager) => Promise<unknown>) =>
        cb(manager),
      ),
  } as unknown as jest.Mocked<DataSource>;

  const posRepoMock: Partial<jest.Mocked<PosRepository>> = {
    findIdempotencyKey: jest.fn().mockResolvedValue(null),
    insertIdempotencyKey: jest.fn().mockResolvedValue(undefined),
  };
  const salesRepoMock: Partial<jest.Mocked<SaleRepository>> = {
    create: jest.fn(),
    findOneById: jest.fn(),
  };
  const saleItemsRepoMock: Partial<jest.Mocked<SaleItemRepository>> = {
    createMany: jest.fn().mockResolvedValue([]),
  };
  const paymentsRepoMock: Partial<jest.Mocked<PaymentRepository>> = {
    create: jest.fn(),
  };
  const creditTxnsRepoMock: Partial<jest.Mocked<CreditTransactionRepository>> =
    {
      create: jest.fn(),
    };
  const stockMovementsRepoMock: Partial<jest.Mocked<StockMovementRepository>> =
    {
      create: jest.fn(),
    };
  const productsRepoMock: Partial<jest.Mocked<ProductsRepository>> = {
    findActiveByIds: jest.fn().mockImplementation((ids: readonly string[]) =>
      Promise.resolve(
        ids
          .filter((id) => productPrices.has(id))
          .map((id) => ({
            id,
            sellingPrice: productPrices.get(id),
          })),
      ),
    ),
  };
  const invoiceNumbersMock: Partial<jest.Mocked<InvoiceNumberService>> = {
    next: jest.fn().mockResolvedValue('INV-2026-000001'),
  };
  const accountingMock = {
    createLedgerEntryWithManager: jest.fn().mockResolvedValue({ id: 'le-1' }),
  };

  // ---------------------------------------------------------------------
  // Loyalty mocks — independently overridable per test so suites that
  // care about a specific earn/redeem/balance triple can dial them in
  // without re-spinning the whole bag.
  // ---------------------------------------------------------------------
  const loyaltyOpts = opts.loyalty ?? {};
  const pointsBalance = loyaltyOpts.pointsBalance ?? 0;
  const pointValue = loyaltyOpts.pointValue ?? 1;
  const earnedPoints = loyaltyOpts.earnedPoints ?? 0;
  const redeemedPoints = loyaltyOpts.redeemedPoints ?? 0;

  const awardForOrder = jest.fn().mockResolvedValue(earnedPoints);
  const redeemForOrder = loyaltyOpts.redeemError
    ? jest.fn().mockRejectedValue(loyaltyOpts.redeemError)
    : jest.fn().mockResolvedValue(redeemedPoints);
  const getOrCreateAccount = jest.fn().mockResolvedValue({
    id: 'acc-1',
    pointsBalance,
    lifetimePointsEarned: earnedPoints,
    lifetimePointsRedeemed: redeemedPoints,
  });
  const getPointValue = jest.fn().mockResolvedValue(pointValue);

  const loyaltyServiceMock = {
    getOrCreateAccount,
    getPointValue,
  };
  const loyaltyWalletServiceMock = {
    awardForOrder,
    redeemForOrder,
  };

  return Test.createTestingModule({
    providers: [
      PosWriteService,
      { provide: PosRepository, useValue: posRepoMock },
      { provide: SaleRepository, useValue: salesRepoMock },
      { provide: SaleItemRepository, useValue: saleItemsRepoMock },
      { provide: PaymentRepository, useValue: paymentsRepoMock },
      { provide: CreditTransactionRepository, useValue: creditTxnsRepoMock },
      { provide: StockMovementRepository, useValue: stockMovementsRepoMock },
      { provide: InvoiceNumberService, useValue: invoiceNumbersMock },
      {
        provide: MultiTenderCalculatorService,
        useValue: new MultiTenderCalculatorService(),
      },
      { provide: ProductsRepository, useValue: productsRepoMock },
      { provide: AccountingService, useValue: accountingMock },
      { provide: LoyaltyService, useValue: loyaltyServiceMock },
      { provide: LoyaltyWalletService, useValue: loyaltyWalletServiceMock },
      { provide: DataSource, useValue: dataSourceMock },
    ],
  })
    .compile()
    .then((module) => ({
      service: module.get(PosWriteService),
      pos: module.get(PosRepository),
      sales: module.get(SaleRepository),
      saleItems: module.get(SaleItemRepository),
      payments: module.get(PaymentRepository),
      creditTransactions: module.get(CreditTransactionRepository),
      stockMovements: module.get(StockMovementRepository),
      invoiceNumbers: module.get(InvoiceNumberService),
      multiTender: module.get(MultiTenderCalculatorService),
      products: module.get(ProductsRepository),
      accounting: accountingMock,
      loyalty: loyaltyServiceMock,
      loyaltyWallet: loyaltyWalletServiceMock,
      dataSource: dataSourceMock,
      inventoryRows,
      managerCalls: {
        invSave,
        invFindOne,
        invQbGetOne,
        invLockSpy,
        unitFindByIds,
        userFindOne,
        userUpdate,
      },
    }));
}

// ---------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------

describe('PosWriteService.createSale', () => {
  it('happy path: single item single cash tender → Paid with cart math correct', async () => {
    // Arrange
    const bag = await buildMocks({ inventoryRows: [makeInvRow('p-1', 50)] });
    const dto = makeDto();
    bag.sales.create.mockResolvedValue({
      id: 'sale-1',
      invoiceNumber: 'INV-2026-000001',
    } as Sale);

    // Act
    await bag.service.createSale(makeCashier(), dto);

    // Assert
    expect(bag.sales.create).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNumber: 'INV-2026-000001',
        subtotal: 100,
        total: 100,
        paidAmount: 100,
        balanceDue: 0,
        paymentStatus: 'Paid',
        status: 'Active',
      }),
      expect.anything(),
    );
    expect(bag.saleItems.createMany).toHaveBeenCalled();
    expect(bag.payments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        saleId: 'sale-1',
        paymentMethod: 'Cash',
        paymentAmount: 100,
        cashChange: 0,
      }),
      expect.anything(),
    );
  });

  it('multi-item with line discount + cart discount + tax produces correct totals', async () => {
    // Arrange
    const bag = await buildMocks({
      inventoryRows: [makeInvRow('p-1', 50), makeInvRow('p-2', 50)],
    });
    const dto = makeDto({
      items: [
        // 2 @ 100 with 10% line discount, 10% tax → subtotal 180, tax 18
        {
          productId: 'p-1',
          quantity: 2,
          unitPrice: 100,
          discountPercentage: 10,
          taxRate: 10,
        },
        // 1 @ 50, no line discount, no tax → subtotal 50
        { productId: 'p-2', quantity: 1, unitPrice: 50 },
      ],
      cartDiscountPercentage: 5,
      payment: {
        paymentMethod: 'Cash',
        paymentAmount: 236.5,
        cashAmount: 236.5,
        cashTendered: 236.5,
      },
    });
    bag.sales.create.mockResolvedValue({
      id: 'sale-1',
      invoiceNumber: 'INV-2026-000001',
    } as Sale);

    // Expected:
    //  itemsSubtotal = 180 + 50 = 230
    //  cartDiscount = 230 * 0.05 = 11.5
    //  taxTotal = 18 + 0 = 18
    //  total = 230 - 11.5 + 18 = 236.5

    // Act
    await bag.service.createSale(makeCashier(), dto);

    // Assert
    expect(bag.sales.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 230,
        discountAmount: 11.5,
        taxAmount: 18,
        total: 236.5,
      }),
      expect.anything(),
    );
  });

  it('split cash + cheque saved on Payment with both fields populated', async () => {
    // Arrange
    const bag = await buildMocks();
    const dto = makeDto({
      payment: {
        paymentMethod: 'Cash',
        paymentAmount: 100,
        cashAmount: 60,
        cashTendered: 60,
        chequeAmount: 40,
        chequeNo: 'CHK-001',
      },
    });
    bag.sales.create.mockResolvedValue({
      id: 'sale-2',
      invoiceNumber: 'INV-2026-000001',
    } as Sale);

    // Act
    await bag.service.createSale(makeCashier(), dto);

    // Assert
    expect(bag.payments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cashAmount: 60,
        chequeAmount: 40,
        chequeNo: 'CHK-001',
        paymentAmount: 100,
      }),
      expect.anything(),
    );
  });

  it('customer credit creates a CreditTransaction row and bumps user.currentBalance', async () => {
    // Arrange
    const bag = await buildMocks({
      userRows: new Map([['cust-1', { id: 'cust-1', currentBalance: 50 }]]),
    });
    const dto = makeDto({
      customerUserId: 'cust-1',
      payment: {
        paymentMethod: 'Credit',
        paymentAmount: 100,
        creditAmount: 100,
      },
    });
    bag.sales.create.mockResolvedValue({
      id: 'sale-3',
      invoiceNumber: 'INV-2026-000003',
    } as Sale);

    // Act
    await bag.service.createSale(makeCashier(), dto);

    // Assert
    expect(bag.creditTransactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'cust-1',
        saleId: 'sale-3',
        transactionType: 'Credit_Taken',
        amount: 100,
        runningBalance: 150,
      }),
      expect.anything(),
    );
    expect(bag.managerCalls.userUpdate).toHaveBeenCalledWith('cust-1', {
      currentBalance: 150,
    });
  });

  it('overpay with keepBalance inserts Credit_Paid and decreases user.currentBalance', async () => {
    // Arrange
    const bag = await buildMocks({
      userRows: new Map([['cust-1', { id: 'cust-1', currentBalance: 80 }]]),
    });
    const dto = makeDto({
      customerUserId: 'cust-1',
      payment: {
        paymentMethod: 'Cash',
        paymentAmount: 120,
        cashAmount: 120,
        cashTendered: 120,
        keepBalance: true,
      },
    });
    bag.sales.create.mockResolvedValue({
      id: 'sale-4',
      invoiceNumber: 'INV-2026-000004',
    } as Sale);

    // Act
    await bag.service.createSale(makeCashier(), dto);

    // Assert: invoice was 100, customer overpaid by 20 → balance drops 80→60
    expect(bag.creditTransactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'cust-1',
        transactionType: 'Credit_Paid',
        amount: 20,
        runningBalance: 60,
      }),
      expect.anything(),
    );
    expect(bag.managerCalls.userUpdate).toHaveBeenCalledWith('cust-1', {
      currentBalance: 60,
    });
  });

  it('insufficient stock throws ConflictException before any sale row writes', async () => {
    // Arrange
    const bag = await buildMocks({ inventoryRows: [makeInvRow('p-1', 0.5)] });
    const dto = makeDto({
      items: [{ productId: 'p-1', quantity: 1, unitPrice: 100 }],
    });

    // Act + Assert
    await expect(bag.service.createSale(makeCashier(), dto)).rejects.toThrow(
      ConflictException,
    );
    expect(bag.sales.create).not.toHaveBeenCalled();
  });

  it('idempotency replay returns the existing sale without a new write', async () => {
    // Arrange
    const bag = await buildMocks();
    bag.pos.findIdempotencyKey.mockResolvedValue({
      key: 'KEY-1',
      cashierId: 'cashier-1',
      saleId: 'sale-replay',
    } as never);
    const existing = {
      id: 'sale-replay',
      invoiceNumber: 'INV-2026-000099',
    } as Sale;
    bag.sales.findOneById.mockResolvedValue(existing);
    const dto = makeDto();

    // Act
    const result = await bag.service.createSale(makeCashier(), dto, 'KEY-1');

    // Assert
    expect(result).toBe(existing);
    expect(bag.sales.create).not.toHaveBeenCalled();
    expect(bag.payments.create).not.toHaveBeenCalled();
  });

  it('idempotency race: insert fails, winner is fetched and returned', async () => {
    // Arrange
    const bag = await buildMocks();
    const dto = makeDto();
    const saved = { id: 'sale-new', invoiceNumber: 'INV-2026-000010' } as Sale;
    const winner = {
      id: 'sale-winner',
      invoiceNumber: 'INV-2026-000011',
    } as Sale;
    bag.sales.create.mockResolvedValue(saved);
    bag.sales.findOneById.mockResolvedValue(winner);
    bag.pos.insertIdempotencyKey.mockRejectedValue(
      new QueryFailedError('insert', [], new Error('duplicate key')),
    );
    bag.pos.findIdempotencyKey
      .mockResolvedValueOnce(null) // initial lookup (no replay)
      .mockResolvedValueOnce({
        key: 'KEY-RACE',
        cashierId: 'cashier-1',
        saleId: 'sale-winner',
      } as never); // race winner

    // Act
    const result = await bag.service.createSale(makeCashier(), dto, 'KEY-RACE');

    // Assert
    expect(result).toBe(winner);
    expect(bag.sales.findOneById).toHaveBeenCalledWith('sale-winner');
  });

  it('weighted sale: 0.250 KG bills at the base KG price and deducts 0.250 KG', async () => {
    const bag = await buildMocks({
      inventoryRows: [makeInvRow('p-banana', 5)],
      productPrices: new Map([['p-banana', 400]]),
    });
    const dto = makeDto({
      items: [
        {
          productId: 'p-banana',
          quantity: 0.25,
          unitPrice: 400,
        },
      ],
      payment: {
        paymentMethod: 'Cash',
        paymentAmount: 100,
        cashAmount: 100,
        cashTendered: 100,
      },
    });
    bag.sales.create.mockResolvedValue({
      id: 'sale-9',
      invoiceNumber: 'INV-2026-000009',
    } as Sale);

    // Act
    await bag.service.createSale(makeCashier(), dto);

    expect(bag.saleItems.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          productId: 'p-banana',
          baseUnitQty: 0.25,
          quantity: 0.25,
          unitPrice: 400,
          lineSubtotal: 100,
          lineTotal: 100,
        }),
      ]),
      expect.anything(),
    );
    expect(bag.stockMovements.create).toHaveBeenCalledWith(
      expect.objectContaining({ qtyOut: 0.25, movementType: 'Sale' }),
      expect.anything(),
    );
    expect(bag.sales.create).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 100, total: 100 }),
      expect.anything(),
    );
  });

  it('pack sale: selected 12-PACK bills at pack price and deducts 12 UNIT', async () => {
    const bag = await buildMocks({
      inventoryRows: [makeInvRow('p-eggs', 24)],
      productPrices: new Map([['p-eggs', 60]]),
      unitsById: new Map([
        [
          'unit-pack',
          {
            id: 'unit-pack',
            productId: 'p-eggs',
            conversionToBase: 12,
            sellingPrice: 650,
          },
        ],
      ]),
    });
    const dto = makeDto({
      items: [
        {
          productId: 'p-eggs',
          unitId: 'unit-pack',
          quantity: 1,
          unitPrice: 650,
        },
      ],
      payment: {
        paymentMethod: 'Cash',
        paymentAmount: 650,
        cashAmount: 650,
        cashTendered: 650,
      },
    });
    bag.sales.create.mockResolvedValue({
      id: 'sale-10',
      invoiceNumber: 'INV-2026-000010',
    } as Sale);

    // Act
    await bag.service.createSale(makeCashier(), dto);

    // Assert
    expect(bag.saleItems.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          baseUnitQty: 12,
          quantity: 1,
          unitPrice: 650,
          lineSubtotal: 650,
          lineTotal: 650,
        }),
      ]),
      expect.anything(),
    );
    expect(bag.stockMovements.create).toHaveBeenCalledWith(
      expect.objectContaining({ qtyOut: 12, movementType: 'Sale' }),
      expect.anything(),
    );
    expect(bag.sales.create).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 650, total: 650 }),
      expect.anything(),
    );
  });

  it('rejects a stale or tampered unitPrice payload', async () => {
    const bag = await buildMocks({
      inventoryRows: [makeInvRow('p-eggs', 24)],
      productPrices: new Map([['p-eggs', 60]]),
      unitsById: new Map([
        [
          'unit-pack',
          {
            id: 'unit-pack',
            productId: 'p-eggs',
            conversionToBase: 12,
            sellingPrice: 650,
          },
        ],
      ]),
    });
    const dto = makeDto({
      items: [
        {
          productId: 'p-eggs',
          unitId: 'unit-pack',
          quantity: 1,
          unitPrice: 1,
        },
      ],
      payment: {
        paymentMethod: 'Cash',
        paymentAmount: 1,
        cashAmount: 1,
        cashTendered: 1,
      },
    });

    await expect(bag.service.createSale(makeCashier(), dto)).rejects.toThrow(
      ConflictException,
    );
    expect(bag.sales.create).not.toHaveBeenCalled();
  });

  it('missing customer when customerUserId set throws NotFoundException', async () => {
    // Arrange — no user row registered
    const bag = await buildMocks({ userRows: new Map() });
    const dto = makeDto({
      customerUserId: 'ghost-customer',
      payment: {
        paymentMethod: 'Credit',
        paymentAmount: 100,
        creditAmount: 100,
      },
    });
    bag.sales.create.mockResolvedValue({
      id: 'sale-ghost',
      invoiceNumber: 'INV-2026-000010',
    } as Sale);

    // Act + Assert
    await expect(bag.service.createSale(makeCashier(), dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('overpay without keepBalance throws BadRequestException via the calculator', async () => {
    // Arrange
    const bag = await buildMocks();
    const dto = makeDto({
      payment: {
        paymentMethod: 'Cash',
        paymentAmount: 150,
        cashAmount: 150,
        cashTendered: 150,
      },
    });

    // Act + Assert
    await expect(bag.service.createSale(makeCashier(), dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(bag.sales.create).not.toHaveBeenCalled();
  });

  it('stock-movement audit row created per line item', async () => {
    // Arrange
    const bag = await buildMocks({
      inventoryRows: [makeInvRow('p-1', 50), makeInvRow('p-2', 50)],
    });
    const dto = makeDto({
      items: [
        { productId: 'p-1', quantity: 2, unitPrice: 100 },
        { productId: 'p-2', quantity: 1, unitPrice: 50 },
      ],
      payment: {
        paymentMethod: 'Cash',
        paymentAmount: 250,
        cashAmount: 250,
        cashTendered: 250,
      },
    });
    bag.sales.create.mockResolvedValue({
      id: 'sale-stockmove',
      invoiceNumber: 'INV-2026-000050',
    } as Sale);

    // Act
    await bag.service.createSale(makeCashier(), dto);

    // Assert
    expect(bag.stockMovements.create).toHaveBeenCalledTimes(2);
    expect(bag.stockMovements.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        productId: 'p-1',
        refType: 'Sale',
        refId: 'sale-stockmove',
        movementType: 'Sale',
        qtyOut: 2,
      }),
      expect.anything(),
    );
    expect(bag.stockMovements.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        productId: 'p-2',
        refType: 'Sale',
        movementType: 'Sale',
        qtyOut: 1,
      }),
      expect.anything(),
    );
  });

  it('writes a ledger CREDIT entry referencing sale.invoiceNumber and saleId', async () => {
    // Arrange
    const bag = await buildMocks();
    const dto = makeDto();
    bag.sales.create.mockResolvedValue({
      id: 'sale-ledger',
      invoiceNumber: 'INV-2026-000077',
    } as Sale);

    // Act
    await bag.service.createSale(makeCashier(), dto);

    // Assert
    expect(bag.accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        branchId: 'branch-A',
        amount: 100,
        referenceNumber: 'INV-2026-000077',
        saleId: 'sale-ledger',
        description: 'POS Sale — INV-2026-000077',
      }),
    );
  });

  // -------------------------------------------------------------------
  // Phase BE-L3 — loyalty wallet wiring
  // -------------------------------------------------------------------

  it('no loyalty owner: sale persists but response carries no loyalty field', async () => {
    // Arrange
    const bag = await buildMocks();
    const dto = makeDto();
    bag.sales.create.mockResolvedValue({
      id: 'sale-no-loyalty',
      invoiceNumber: 'INV-2026-000200',
    } as Sale);

    // Act
    const result = await bag.service.createSale(makeCashier(), dto);

    // Assert: wallet was never touched, response has no loyalty key.
    expect(bag.loyaltyWallet.awardForOrder).not.toHaveBeenCalled();
    expect(bag.loyaltyWallet.redeemForOrder).not.toHaveBeenCalled();
    expect(bag.loyalty.getOrCreateAccount).not.toHaveBeenCalled();
    expect((result as { loyalty?: unknown }).loyalty).toBeUndefined();
  });

  it('user-side award only: customerUserId triggers award with branchId + paidAmount', async () => {
    // Arrange — user-side sale, no redeem
    const bag = await buildMocks({
      userRows: new Map([['cust-1', { id: 'cust-1', currentBalance: 0 }]]),
      loyalty: { earnedPoints: 10, pointsBalance: 10 },
    });
    const dto = makeDto({ customerUserId: 'cust-1' });
    bag.sales.create.mockResolvedValue({
      id: 'sale-user-award',
      invoiceNumber: 'INV-2026-000201',
    } as Sale);

    // Act
    const result = await bag.service.createSale(makeCashier(), dto);

    // Assert
    expect(bag.loyaltyWallet.redeemForOrder).not.toHaveBeenCalled();
    expect(bag.loyaltyWallet.awardForOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: { userId: 'cust-1' },
        orderId: 'sale-user-award',
        orderCode: 'INV-2026-000201',
        paidAmount: 100,
        branchId: 'branch-A',
      }),
    );
    expect((result as { loyalty?: { ownerType: string } }).loyalty).toEqual({
      ownerType: 'user',
      earned: 10,
      redeemed: 0,
      newBalance: 10,
    });
  });

  it('walk-in award only: loyaltyCustomerId triggers award against the walk-in wallet', async () => {
    // Arrange
    const bag = await buildMocks({
      loyalty: { earnedPoints: 5, pointsBalance: 5 },
    });
    const dto = makeDto({ loyaltyCustomerId: 'walkin-1' });
    bag.sales.create.mockResolvedValue({
      id: 'sale-walkin',
      invoiceNumber: 'INV-2026-000202',
    } as Sale);

    // Act
    const result = await bag.service.createSale(makeCashier(), dto);

    // Assert
    expect(bag.loyaltyWallet.redeemForOrder).not.toHaveBeenCalled();
    expect(bag.loyaltyWallet.awardForOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: { loyaltyCustomerId: 'walkin-1' },
        orderId: 'sale-walkin',
        orderCode: 'INV-2026-000202',
        paidAmount: 100,
        branchId: 'branch-A',
      }),
    );
    expect((result as { loyalty?: { ownerType: string } }).loyalty).toEqual({
      ownerType: 'walkIn',
      earned: 5,
      redeemed: 0,
      newBalance: 5,
    });
  });

  it('redeem + award: paidAmount for award is gross MINUS redeem value in LKR', async () => {
    // Arrange — invoice 1000, redeem 50 pts @ Rs 1/pt → net paid 950
    const bag = await buildMocks({
      inventoryRows: [makeInvRow('p-1', 50)],
      userRows: new Map([['cust-1', { id: 'cust-1', currentBalance: 0 }]]),
      loyalty: {
        pointValue: 1,
        redeemedPoints: 50,
        earnedPoints: 9,
        pointsBalance: 150,
      },
    });
    const dto = makeDto({
      customerUserId: 'cust-1',
      loyaltyRedeemPoints: 50,
      items: [{ productId: 'p-1', quantity: 10, unitPrice: 100 }],
      payment: {
        paymentMethod: 'Cash',
        paymentAmount: 1000,
        cashAmount: 1000,
        cashTendered: 1000,
      },
    });
    bag.sales.create.mockResolvedValue({
      id: 'sale-redeem-award',
      invoiceNumber: 'INV-2026-000203',
    } as Sale);

    // Act
    await bag.service.createSale(makeCashier(), dto);

    // Assert: redeem invoked first with requestedPoints + subtotal cap.
    expect(bag.loyaltyWallet.redeemForOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: { userId: 'cust-1' },
        orderId: 'sale-redeem-award',
        subtotal: 1000,
        requestedPoints: 50,
        branchId: 'branch-A',
      }),
    );
    // Award called with NET paid = 1000 - (50 * 1) = 950.
    expect(bag.loyaltyWallet.awardForOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: { userId: 'cust-1' },
        orderId: 'sale-redeem-award',
        paidAmount: 950,
        branchId: 'branch-A',
      }),
    );
  });

  it('both ownership fields set → BadRequestException before any DB write', async () => {
    // Arrange
    const bag = await buildMocks();
    const dto = makeDto({
      customerUserId: 'cust-1',
      loyaltyCustomerId: 'walkin-1',
    });

    // Act + Assert
    await expect(bag.service.createSale(makeCashier(), dto)).rejects.toThrow(
      BadRequestException,
    );
    // Nothing should have hit the DB or the wallet.
    expect(bag.sales.create).not.toHaveBeenCalled();
    expect(bag.payments.create).not.toHaveBeenCalled();
    expect(bag.loyaltyWallet.awardForOrder).not.toHaveBeenCalled();
    expect(bag.loyaltyWallet.redeemForOrder).not.toHaveBeenCalled();
  });

  it('redeem fails (insufficient points) → BadRequestException rolls the sale back', async () => {
    // Arrange — wallet's redeemForOrder throws (insufficient balance).
    // Throw must propagate out of the dataSource.transaction callback so
    // the surrounding write (sale + items + payment) is rolled back.
    const bag = await buildMocks({
      userRows: new Map([['cust-1', { id: 'cust-1', currentBalance: 0 }]]),
      loyalty: {
        redeemError: new BadRequestException('Not enough loyalty points'),
      },
    });
    const dto = makeDto({
      customerUserId: 'cust-1',
      loyaltyRedeemPoints: 9999,
    });
    bag.sales.create.mockResolvedValue({
      id: 'sale-redeem-fail',
      invoiceNumber: 'INV-2026-000204',
    } as Sale);

    // Act + Assert: BadRequestException bubbles, award never runs.
    await expect(bag.service.createSale(makeCashier(), dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(bag.loyaltyWallet.awardForOrder).not.toHaveBeenCalled();
  });
});
