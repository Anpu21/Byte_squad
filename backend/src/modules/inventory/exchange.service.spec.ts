/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { ExchangeService } from './exchange.service';
import { ReturnsService } from './returns.service';
import { SalesReturnRepository } from './sales-return.repository';
import { PosWriteService } from '@pos/pos-write.service';
import { PosRepository } from '@pos/pos.repository';
import { PosService } from '@pos/pos.service';
import { SalesReturn } from '@inventory/entities/sales-return.entity';

const CASHIER: AuthUser = {
  id: 'cashier-1',
  email: 'c@x.com',
  role: UserRole.CASHIER,
  branchId: 'branch-1',
};

const ORIGINAL_SALE = {
  id: 'sale-orig',
  branchId: 'branch-1',
  location: 'Shop',
  customerUserId: null,
  status: 'Active',
};

function baseDto(overrides: Record<string, unknown> = {}) {
  return {
    saleId: 'sale-orig',
    reason: 'Defective',
    returnedLines: [
      { saleItemId: 'si-1', goodQuantity: 1, badQuantity: 0, restockGood: true },
    ],
    replacementItems: [{ productId: 'p-2', quantity: 1, unitPrice: 100 }],
    ...overrides,
  } as never;
}

describe('ExchangeService', () => {
  let service: ExchangeService;
  let returns: {
    computeReturn: jest.Mock;
    persistReturnWithinTxn: jest.Mock;
  };
  let posWrite: {
    computeReplacement: jest.Mock;
    persistReplacementWithinTxn: jest.Mock;
  };
  let pos: { findIdempotencyKey: jest.Mock; insertIdempotencyKey: jest.Mock };
  let sales: { findOneById: jest.Mock };
  let returnsRepo: { findById: jest.Mock };
  let updateMock: jest.Mock;

  // R (returned value) and P (replacement value) drive the settlement branch.
  function arrange(R: number, P: number) {
    returns.computeReturn.mockResolvedValue({
      sale: ORIGINAL_SALE,
      reason: 'Defective',
      returnItems: [],
      restockOps: [],
      damageOps: [],
      totalRefund: R,
      restockedValue: R,
    });
    returns.persistReturnWithinTxn.mockResolvedValue({ id: 'ret-1' });
    posWrite.computeReplacement.mockResolvedValue({
      itemRows: [],
      itemsSubtotal: P,
      taxTotal: 0,
      total: P,
    });
    posWrite.persistReplacementWithinTxn.mockResolvedValue({ id: 'repl-1' });
  }

  beforeEach(async () => {
    updateMock = jest.fn().mockResolvedValue(undefined);
    const managerMock = { getRepository: jest.fn(() => ({ update: updateMock })) };
    const dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(managerMock)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExchangeService,
        {
          provide: ReturnsService,
          useValue: {
            computeReturn: jest.fn(),
            persistReturnWithinTxn: jest.fn(),
          },
        },
        { provide: SalesReturnRepository, useValue: { findById: jest.fn() } },
        {
          provide: PosWriteService,
          useValue: {
            computeReplacement: jest.fn(),
            persistReplacementWithinTxn: jest.fn(),
          },
        },
        {
          provide: PosRepository,
          useValue: {
            findIdempotencyKey: jest.fn().mockResolvedValue(null),
            insertIdempotencyKey: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: PosService, useValue: { findOneById: jest.fn() } },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(ExchangeService);
    returns = moduleRef.get(ReturnsService);
    posWrite = moduleRef.get(PosWriteService);
    pos = moduleRef.get(PosRepository);
    sales = moduleRef.get(PosService);
    returnsRepo = moduleRef.get(SalesReturnRepository);
  });

  it('even swap: no money moves and both legs are marked as an exchange', async () => {
    arrange(1000, 1000);

    const result = await service.createExchange(CASHIER, baseDto());

    expect(returns.persistReturnWithinTxn).toHaveBeenCalledWith(
      expect.anything(),
      CASHIER,
      expect.anything(),
      { type: 'Exchange', refundOverride: 0 },
    );
    expect(posWrite.persistReplacementWithinTxn).toHaveBeenCalledWith(
      expect.anything(),
      CASHIER,
      expect.objectContaining({
        exchangeReturnId: 'ret-1',
        branchId: 'branch-1',
        payment: { paymentAmount: 0, cashAmount: 0, cashTendered: 0, cashChange: 0 },
      }),
    );
    // Return is back-linked to the replacement sale.
    expect(updateMock).toHaveBeenCalledWith('ret-1', {
      replacementSaleId: 'repl-1',
    });
    expect(result.salesReturn.replacementSaleId).toBe('repl-1');
  });

  it('dearer swap (cash): charges the difference as cash-in with change', async () => {
    arrange(490, 2200);

    await service.createExchange(
      CASHIER,
      baseDto({
        payment: {
          paymentMethod: 'Cash',
          paymentAmount: 1710,
          cashAmount: 1710,
          cashTendered: 2000,
        },
      }),
    );

    expect(posWrite.persistReplacementWithinTxn).toHaveBeenCalledWith(
      expect.anything(),
      CASHIER,
      expect.objectContaining({
        payment: {
          paymentAmount: 1710,
          cashAmount: 1710,
          cashTendered: 2000,
          cashChange: 290,
        },
      }),
    );
    expect(returns.persistReturnWithinTxn).toHaveBeenCalledWith(
      expect.anything(),
      CASHIER,
      expect.anything(),
      { type: 'Exchange', refundOverride: 0 },
    );
  });

  it('dearer swap (card): amount rides payment_amount, cash stays 0 (card residual)', async () => {
    arrange(490, 2200);

    await service.createExchange(
      CASHIER,
      baseDto({ payment: { paymentMethod: 'Card', paymentAmount: 1710 } }),
    );

    expect(posWrite.persistReplacementWithinTxn).toHaveBeenCalledWith(
      expect.anything(),
      CASHIER,
      expect.objectContaining({
        payment: { paymentAmount: 1710, cashAmount: 0, cashTendered: 0, cashChange: 0 },
      }),
    );
  });

  it('cheaper swap: refunds the difference in cash on the return leg, no payment', async () => {
    arrange(6710, 2200);

    await service.createExchange(CASHIER, baseDto());

    expect(returns.persistReturnWithinTxn).toHaveBeenCalledWith(
      expect.anything(),
      CASHIER,
      expect.anything(),
      { type: 'Exchange', refundOverride: 4510 },
    );
    expect(posWrite.persistReplacementWithinTxn).toHaveBeenCalledWith(
      expect.anything(),
      CASHIER,
      expect.objectContaining({
        payment: { paymentAmount: 0, cashAmount: 0, cashTendered: 0, cashChange: 0 },
      }),
    );
  });

  it('rejects a dearer swap with no payment', async () => {
    arrange(490, 2200);

    await expect(
      service.createExchange(CASHIER, baseDto()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(returns.persistReturnWithinTxn).not.toHaveBeenCalled();
  });

  it('rejects a dearer cash swap with insufficient tender', async () => {
    arrange(490, 2200);

    await expect(
      service.createExchange(
        CASHIER,
        baseDto({
          payment: { paymentMethod: 'Cash', paymentAmount: 1000, cashAmount: 1000, cashTendered: 1000 },
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('replays an existing exchange from the idempotency key without re-writing', async () => {
    pos.findIdempotencyKey.mockResolvedValue({ saleId: 'repl-1' });
    sales.findOneById.mockResolvedValue({
      id: 'repl-1',
      exchangeReturnId: 'ret-1',
    });
    returnsRepo.findById.mockResolvedValue({ id: 'ret-1' });

    const result = await service.createExchange(CASHIER, baseDto(), 'key-123');

    expect(result.replacementSale.id).toBe('repl-1');
    expect(result.salesReturn.id).toBe('ret-1');
    // No new writes on replay.
    expect(returns.computeReturn).not.toHaveBeenCalled();
    expect(returns.persistReturnWithinTxn).not.toHaveBeenCalled();
  });
});
