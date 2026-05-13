/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';
import { AccountingRepository } from '@accounting/accounting.repository';
import { Transaction } from './entities/transaction.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { TransactionType } from '@common/enums/transaction.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { PaymentMethod } from '@common/enums/payment-method';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('PosService.createTransaction (idempotency)', () => {
  let service: PosService;
  let pos: jest.Mocked<PosRepository>;
  let accounting: jest.Mocked<AccountingRepository>;

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

  beforeEach(async () => {
    const posMock: Partial<jest.Mocked<PosRepository>> = {
      createAndSaveTransaction: jest.fn(),
      findTransactionById: jest.fn(),
      findTransactionsByBranch: jest.fn(),
      findTransactionsForCashierSince: jest.fn(),
      findRecentForCashier: jest.fn(),
      findTransactionsSince: jest.fn(),
      findRecent: jest.fn(),
      findRecentWithBranch: jest.fn(),
      periodAggregateForBranch: jest.fn(),
      periodAggregateSystem: jest.fn(),
      findRecentScopedTransactions: jest.fn(),
      topProductsSince: jest.fn(),
      countActiveProducts: jest.fn(),
      countLowStockItems: jest.fn(),
      countAllUsers: jest.fn(),
      countActiveBranches: jest.fn(),
      findIdempotencyKey: jest.fn(),
      insertIdempotencyKey: jest.fn(),
    };
    const accountingMock: Partial<jest.Mocked<AccountingRepository>> = {
      createLedgerEntry: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PosRepository, useValue: posMock },
        { provide: AccountingRepository, useValue: accountingMock },
      ],
    }).compile();

    service = module.get(PosService);
    pos = module.get(PosRepository);
    accounting = module.get(AccountingRepository);
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
    expect(pos.createAndSaveTransaction).not.toHaveBeenCalled();
    expect(accounting.createLedgerEntry).not.toHaveBeenCalled();
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
    pos.createAndSaveTransaction.mockResolvedValue({
      id: 'txn-new',
      total: 10,
      transactionNumber: 'TXN-X',
      branchId: 'branch-1',
    } as Transaction);
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
    expect(accounting.createLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 10 }),
    );
  });

  it('falls back to the race-winning transaction on unique-violation', async () => {
    pos.findIdempotencyKey.mockResolvedValueOnce(null).mockResolvedValueOnce({
      transactionId: 'txn-winner',
    } as IdempotencyKey);
    pos.createAndSaveTransaction.mockResolvedValue({
      id: 'txn-loser',
      total: 0,
      transactionNumber: 'TXN-L',
      branchId: 'branch-1',
    } as Transaction);
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
    pos.createAndSaveTransaction.mockResolvedValue({
      id: 'txn-zero',
      total: 0,
      transactionNumber: 'TXN-0',
      branchId: 'branch-1',
    } as Transaction);

    await service.createTransaction(baseDto, 'cashier-1', 'branch-1');
    expect(accounting.createLedgerEntry).not.toHaveBeenCalled();
  });

  describe('createTransaction totals', () => {
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
      pos.createAndSaveTransaction.mockResolvedValue({
        id: 'txn',
        total: 500,
        transactionNumber: 'TXN-X',
        branchId: 'branch-1',
      } as Transaction);

      await service.createTransaction(
        makeDto([{ unitPrice: 250, quantity: 2 }]),
        'cashier-1',
        'branch-1',
      );

      expect(pos.createAndSaveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 500,
          total: 500,
          items: [expect.objectContaining({ lineTotal: 500 })],
        }),
      );
    });

    it('applies a percentage line discount against the line base', async () => {
      pos.createAndSaveTransaction.mockResolvedValue({
        id: 'txn',
        total: 180,
        transactionNumber: 'TXN-X',
        branchId: 'branch-1',
      } as Transaction);

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

      expect(pos.createAndSaveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 200,
          total: 180,
          items: [expect.objectContaining({ lineTotal: 180 })],
        }),
      );
    });

    it('applies a fixed line discount as a money amount', async () => {
      pos.createAndSaveTransaction.mockResolvedValue({
        id: 'txn',
        total: 185,
        transactionNumber: 'TXN-X',
        branchId: 'branch-1',
      } as Transaction);

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

      expect(pos.createAndSaveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 200,
          total: 185,
          items: [expect.objectContaining({ lineTotal: 185 })],
        }),
      );
    });

    it('stacks a cart-wide percentage on top of line discounts', async () => {
      pos.createAndSaveTransaction.mockResolvedValue({
        id: 'txn',
        total: 162,
        transactionNumber: 'TXN-X',
        branchId: 'branch-1',
      } as Transaction);

      // line: 100 × 2 with 10% → 180. cart: 10% on 180 → 18. total = 162.
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

      expect(pos.createAndSaveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 200,
          discountAmount: 10,
          discountType: DiscountType.PERCENTAGE,
          total: 162,
        }),
      );
    });

    it('creates a ledger entry with the computed total when total > 0', async () => {
      pos.createAndSaveTransaction.mockResolvedValue({
        id: 'txn',
        total: 500,
        transactionNumber: 'TXN-X',
        branchId: 'branch-1',
      } as Transaction);

      await service.createTransaction(
        makeDto([{ unitPrice: 250, quantity: 2 }]),
        'cashier-1',
        'branch-1',
      );

      expect(accounting.createLedgerEntry).toHaveBeenCalledTimes(1);
      expect(accounting.createLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 500 }),
      );
    });
  });
});
