/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';
import { AccountingRepository } from '@accounting/accounting.repository';
import { Transaction } from './entities/transaction.entity';
import { TransactionItem } from './entities/transaction-item.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { TransactionType } from '@common/enums/transaction.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { PaymentMethod } from '@common/enums/payment-method';
import { CreateTransactionDto } from './dto/create-transaction.dto';

interface InventoryQB {
  setLock: jest.Mock<InventoryQB, []>;
  where: jest.Mock<InventoryQB, [string, { productId?: string }?]>;
  andWhere: jest.Mock<InventoryQB, [string, { branchId?: string }?]>;
  getOne: jest.Mock<Promise<Inventory | null>, []>;
}

interface TxnHarness {
  savedTxn: Transaction | null;
  savedItems: TransactionItem[];
  ledgerCalls: Array<Record<string, unknown>>;
  inventoryByProductId: Map<string, Inventory>;
  inventorySaves: Inventory[];
}

function buildHarness(
  inventoryByProductId: Map<string, Inventory>,
): TxnHarness {
  return {
    savedTxn: null,
    savedItems: [],
    ledgerCalls: [],
    inventoryByProductId,
    inventorySaves: [],
  };
}

function makeManager(harness: TxnHarness, txnId = 'txn-new'): unknown {
  const inventoryRepo = {
    createQueryBuilder: jest.fn((): InventoryQB => {
      let capturedProductId: string | undefined;
      const qb: InventoryQB = {
        setLock: jest.fn(() => qb),
        where: jest.fn((_sql: string, params?: { productId?: string }) => {
          if (params?.productId) capturedProductId = params.productId;
          return qb;
        }),
        andWhere: jest.fn((_sql: string, params?: { branchId?: string }) => {
          void params;
          return qb;
        }),
        getOne: jest.fn(() => {
          if (!capturedProductId) return Promise.resolve(null);
          return Promise.resolve(
            harness.inventoryByProductId.get(capturedProductId) ?? null,
          );
        }),
      };
      return qb;
    }),
    save: jest.fn((inv: Inventory) => {
      harness.inventorySaves.push({ ...inv });
      return Promise.resolve(inv);
    }),
  };

  const transactionRepo = {
    create: jest.fn((data: Partial<Transaction>) => data),
    save: jest.fn((data: Partial<Transaction>) => {
      harness.savedTxn = { ...data, id: txnId } as Transaction;
      return Promise.resolve(harness.savedTxn);
    }),
  };

  const itemRepo = {
    create: jest.fn((data: Partial<TransactionItem>) => data),
    save: jest.fn((rows: Array<Partial<TransactionItem>>) => {
      const persisted = rows.map(
        (r, idx) => ({ ...r, id: `ti-${idx + 1}` }) as TransactionItem,
      );
      harness.savedItems.push(...persisted);
      return Promise.resolve(persisted);
    }),
  };

  return {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Inventory) return inventoryRepo;
      if (entity === Transaction) return transactionRepo;
      if (entity === TransactionItem) return itemRepo;
      throw new Error('Unexpected entity in transaction mock');
    }),
  };
}

describe('PosService.createTransaction', () => {
  let service: PosService;
  let pos: jest.Mocked<PosRepository>;
  let accounting: jest.Mocked<AccountingRepository>;
  let dataSource: { transaction: jest.Mock };

  const baseDto: CreateTransactionDto = {
    type: TransactionType.SALE,
    paymentMethod: PaymentMethod.CASH,
    discountAmount: 0,
    discountType: DiscountType.NONE,
    items: [
      {
        productId: 'p1',
        quantity: 1,
        unitPrice: 10,
        discountAmount: 0,
        discountType: DiscountType.NONE,
      },
    ],
  };

  function mockSale(opts: {
    inventory: Array<{ productId: string; quantity: number }>;
    txnId?: string;
  }): TxnHarness {
    const invMap = new Map<string, Inventory>();
    for (const inv of opts.inventory) {
      invMap.set(inv.productId, {
        productId: inv.productId,
        quantity: inv.quantity,
        branchId: 'branch-1',
      } as Inventory);
    }
    const harness = buildHarness(invMap);
    dataSource.transaction.mockImplementation(
      async (cb: (m: unknown) => Promise<unknown>) =>
        cb(makeManager(harness, opts.txnId)),
    );
    return harness;
  }

  beforeEach(async () => {
    const posMock: Partial<jest.Mocked<PosRepository>> = {
      findTransactionById: jest.fn(),
      findIdempotencyKey: jest.fn(),
      insertIdempotencyKey: jest.fn(),
    };
    const accountingMock: Partial<jest.Mocked<AccountingRepository>> = {
      createLedgerEntryWithManager: jest.fn(),
    };
    const dataSourceMock = { transaction: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PosRepository, useValue: posMock },
        { provide: AccountingRepository, useValue: accountingMock },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();

    service = module.get(PosService);
    pos = module.get(PosRepository);
    accounting = module.get(AccountingRepository);
    dataSource = module.get(DataSource);
  });

  it('returns the original transaction when the same idempotency key replays', async () => {
    pos.findIdempotencyKey.mockResolvedValue({
      transactionId: 'txn-existing',
    } as IdempotencyKey);
    pos.findTransactionById.mockResolvedValue({
      id: 'txn-existing',
    } as Transaction);

    const result = await service.createTransaction(
      baseDto,
      'cashier-1',
      'branch-1',
      'idem-key',
    );
    expect(result.id).toBe('txn-existing');
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(accounting.createLedgerEntryWithManager).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the idempotency key points at a missing transaction', async () => {
    pos.findIdempotencyKey.mockResolvedValue({
      transactionId: 'gone',
    } as IdempotencyKey);
    pos.findTransactionById.mockResolvedValue(null);

    await expect(
      service.createTransaction(baseDto, 'cashier-1', 'branch-1', 'idem-key'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('persists the idempotency row alongside a new transaction', async () => {
    pos.findIdempotencyKey.mockResolvedValueOnce(null);
    const harness = mockSale({
      inventory: [{ productId: 'p1', quantity: 10 }],
    });
    pos.insertIdempotencyKey.mockResolvedValue(undefined);

    await service.createTransaction(
      baseDto,
      'cashier-1',
      'branch-1',
      'idem-key',
    );
    expect(pos.insertIdempotencyKey).toHaveBeenCalledWith({
      key: 'idem-key',
      cashierId: 'cashier-1',
      transactionId: 'txn-new',
    });
    expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ amount: 10 }),
    );
    expect(harness.savedTxn?.transactionNumber).toMatch(/^TXN-/);
  });

  it('falls back to the race-winning transaction on unique-violation', async () => {
    pos.findIdempotencyKey.mockResolvedValueOnce(null).mockResolvedValueOnce({
      transactionId: 'txn-winner',
    } as IdempotencyKey);
    mockSale({
      inventory: [{ productId: 'p1', quantity: 10 }],
      txnId: 'txn-loser',
    });
    const violation = new QueryFailedError('insert', [], new Error('dup key'));
    pos.insertIdempotencyKey.mockRejectedValue(violation);
    pos.findTransactionById.mockResolvedValue({
      id: 'txn-winner',
    } as Transaction);

    const result = await service.createTransaction(
      baseDto,
      'cashier-1',
      'branch-1',
      'idem-key',
    );
    expect(result.id).toBe('txn-winner');
  });

  it('skips ledger entry when the transaction total is zero', async () => {
    mockSale({ inventory: [{ productId: 'p1', quantity: 10 }] });

    const zeroDto: CreateTransactionDto = {
      ...baseDto,
      items: [{ ...baseDto.items[0], unitPrice: 0 }],
    };
    await service.createTransaction(zeroDto, 'cashier-1', 'branch-1');
    expect(accounting.createLedgerEntryWithManager).not.toHaveBeenCalled();
  });

  describe('inventory enforcement', () => {
    it('decrements branch inventory for each sale line', async () => {
      const harness = mockSale({
        inventory: [
          { productId: 'p1', quantity: 10 },
          { productId: 'p2', quantity: 5 },
        ],
      });

      const dto: CreateTransactionDto = {
        type: TransactionType.SALE,
        paymentMethod: PaymentMethod.CASH,
        items: [
          {
            productId: 'p1',
            quantity: 3,
            unitPrice: 10,
            discountAmount: 0,
            discountType: DiscountType.NONE,
          },
          {
            productId: 'p2',
            quantity: 2,
            unitPrice: 20,
            discountAmount: 0,
            discountType: DiscountType.NONE,
          },
        ],
      };

      await service.createTransaction(dto, 'cashier-1', 'branch-1');

      expect(harness.inventorySaves).toHaveLength(2);
      const byProduct = new Map(
        harness.inventorySaves.map((s) => [s.productId, s.quantity]),
      );
      expect(byProduct.get('p1')).toBe(7);
      expect(byProduct.get('p2')).toBe(3);
    });

    it('throws ConflictException when stock is short and writes nothing', async () => {
      const harness = mockSale({
        inventory: [{ productId: 'p1', quantity: 1 }],
      });

      const dto: CreateTransactionDto = {
        type: TransactionType.SALE,
        paymentMethod: PaymentMethod.CASH,
        items: [
          {
            productId: 'p1',
            quantity: 5,
            unitPrice: 10,
            discountAmount: 0,
            discountType: DiscountType.NONE,
          },
        ],
      };

      await expect(
        service.createTransaction(dto, 'cashier-1', 'branch-1'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(harness.savedTxn).toBeNull();
      expect(harness.savedItems).toHaveLength(0);
      expect(accounting.createLedgerEntryWithManager).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the product is not stocked at the branch', async () => {
      mockSale({ inventory: [] });

      const dto: CreateTransactionDto = {
        type: TransactionType.SALE,
        paymentMethod: PaymentMethod.CASH,
        items: [
          {
            productId: 'p-unknown',
            quantity: 1,
            unitPrice: 10,
            discountAmount: 0,
            discountType: DiscountType.NONE,
          },
        ],
      };

      await expect(
        service.createTransaction(dto, 'cashier-1', 'branch-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('does not decrement inventory for RETURN transactions', async () => {
      const harness = mockSale({
        inventory: [{ productId: 'p1', quantity: 10 }],
      });

      const dto: CreateTransactionDto = {
        type: TransactionType.RETURN,
        paymentMethod: PaymentMethod.CASH,
        items: [
          {
            productId: 'p1',
            quantity: 1,
            unitPrice: 10,
            discountAmount: 0,
            discountType: DiscountType.NONE,
          },
        ],
      };
      await service.createTransaction(dto, 'cashier-1', 'branch-1');

      expect(harness.inventorySaves).toHaveLength(0);
      expect(harness.savedTxn?.type).toBe(TransactionType.RETURN);
    });
  });

  describe('totals', () => {
    function makeDto(
      items: Array<{
        unitPrice: number;
        quantity: number;
        discountAmount?: number;
        discountType?: DiscountType;
      }>,
      cart: { discountAmount?: number; discountType?: DiscountType } = {},
    ): CreateTransactionDto {
      return {
        type: TransactionType.SALE,
        paymentMethod: PaymentMethod.CASH,
        discountAmount: cart.discountAmount ?? 0,
        discountType: cart.discountType ?? DiscountType.NONE,
        items: items.map((it, idx) => ({
          productId: `p${idx + 1}`,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountAmount: it.discountAmount ?? 0,
          discountType: it.discountType ?? DiscountType.NONE,
        })),
      };
    }

    it('computes subtotal/total/lineTotal with no discount', async () => {
      const harness = mockSale({
        inventory: [{ productId: 'p1', quantity: 10 }],
      });
      await service.createTransaction(
        makeDto([{ unitPrice: 250, quantity: 2 }]),
        'cashier-1',
        'branch-1',
      );
      expect(harness.savedTxn?.subtotal).toBe(500);
      expect(harness.savedTxn?.total).toBe(500);
      expect(harness.savedItems[0]?.lineTotal).toBe(500);
    });

    it('applies a percentage line discount against the line base', async () => {
      const harness = mockSale({
        inventory: [{ productId: 'p1', quantity: 10 }],
      });
      await service.createTransaction(
        makeDto([
          {
            unitPrice: 100,
            quantity: 2,
            discountAmount: 10,
            discountType: DiscountType.PERCENTAGE,
          },
        ]),
        'cashier-1',
        'branch-1',
      );
      expect(harness.savedTxn?.total).toBe(180);
      expect(harness.savedItems[0]?.lineTotal).toBe(180);
    });

    it('applies a fixed line discount as a money amount', async () => {
      const harness = mockSale({
        inventory: [{ productId: 'p1', quantity: 10 }],
      });
      await service.createTransaction(
        makeDto([
          {
            unitPrice: 100,
            quantity: 2,
            discountAmount: 15,
            discountType: DiscountType.FIXED,
          },
        ]),
        'cashier-1',
        'branch-1',
      );
      expect(harness.savedTxn?.total).toBe(185);
      expect(harness.savedItems[0]?.lineTotal).toBe(185);
    });

    it('stacks a cart-wide percentage on top of line discounts', async () => {
      const harness = mockSale({
        inventory: [{ productId: 'p1', quantity: 10 }],
      });
      await service.createTransaction(
        makeDto(
          [
            {
              unitPrice: 100,
              quantity: 2,
              discountAmount: 10,
              discountType: DiscountType.PERCENTAGE,
            },
          ],
          { discountAmount: 10, discountType: DiscountType.PERCENTAGE },
        ),
        'cashier-1',
        'branch-1',
      );
      expect(harness.savedTxn?.subtotal).toBe(200);
      expect(harness.savedTxn?.discountAmount).toBe(10);
      expect(harness.savedTxn?.discountType).toBe(DiscountType.PERCENTAGE);
      expect(harness.savedTxn?.total).toBe(162);
    });

    it('creates a ledger entry with the computed total when total > 0', async () => {
      mockSale({ inventory: [{ productId: 'p1', quantity: 10 }] });
      await service.createTransaction(
        makeDto([{ unitPrice: 250, quantity: 2 }]),
        'cashier-1',
        'branch-1',
      );
      expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledTimes(1);
      expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ amount: 500 }),
      );
    });
  });
});
