/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { ReturnsService } from './returns.service';
import { SalesReturnRepository } from './sales-return.repository';
import { PosService } from '@pos/pos.service';
import { AccountingService } from '@accounting/accounting.service';
import { Inventory } from '@inventory/entities/inventory.entity';
import { StockMovement } from '@pos/entities/stock-movement.entity';
import type { SalesReturn } from '@inventory/entities/sales-return.entity';
import type { AuthUser } from '@common/types/auth-user.type';

const BRANCH_A = '11111111-1111-1111-1111-111111111111';
const BRANCH_B = '22222222-2222-2222-2222-222222222222';
const PRODUCT_ID = '44444444-4444-4444-4444-444444444444';
const SALE_ID = '66666666-6666-6666-6666-666666666666';
const RETURN_ID = '77777777-7777-7777-7777-777777777777';
const MANAGER: AuthUser = {
  id: 'manager-1',
  email: 'm@x.com',
  role: UserRole.MANAGER,
  branchId: BRANCH_A,
};
const CASHIER: AuthUser = {
  id: 'cashier-1',
  email: 'c@x.com',
  role: UserRole.CASHIER,
  branchId: BRANCH_A,
};
const ADMIN: AuthUser = {
  id: 'admin-1',
  email: 'a@x.com',
  role: UserRole.ADMIN,
  branchId: null,
};

// Sold 3 @ unitPrice 1000 but lineTotal 2700 (10% discount) → perUnitRefund 900,
// so a refund computed off unitPrice (1000) would be detectably wrong.
function makeSale() {
  return {
    id: SALE_ID,
    invoiceNumber: 'INV-2026-000002',
    branchId: BRANCH_A,
    customerUserId: null,
    status: 'Active',
    location: 'Shop',
    total: 2700,
    createdAt: new Date(),
    items: [
      {
        id: 'si-1',
        productId: PRODUCT_ID,
        status: 'Active',
        quantity: 3,
        baseUnitQty: 3,
        unitPrice: 1000,
        lineTotal: 2700,
        product: { name: 'Apples', barcode: '' },
        unit: { name: 'unit' },
      },
    ],
  };
}

// good 1 (restock) + bad 2 (damage) = 3 units, the full remainder.
const baseDto = {
  saleId: SALE_ID,
  reason: 'Bruised',
  lines: [
    { saleItemId: 'si-1', goodQuantity: 1, badQuantity: 2, restockGood: true },
  ],
};

describe('ReturnsService', () => {
  let service: ReturnsService;
  let returnsRepo: jest.Mocked<SalesReturnRepository>;
  let sales: jest.Mocked<PosService>;
  let accounting: jest.Mocked<AccountingService>;
  let invRepo: {
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let movementRepo: { create: jest.Mock; save: jest.Mock };
  let invGetOne: jest.Mock;

  beforeEach(async () => {
    invGetOne = jest
      .fn()
      .mockResolvedValueOnce({ id: 'inv-1', quantity: 10 }) // restock read
      .mockResolvedValueOnce({ id: 'inv-1', quantity: 11 }); // damage read
    const invBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: invGetOne,
    };
    invRepo = {
      createQueryBuilder: jest.fn(() => invBuilder),
      save: jest.fn((x: unknown) => Promise.resolve(x)),
      create: jest.fn((x: unknown) => x),
    };
    movementRepo = {
      create: jest.fn((x: unknown) => x),
      save: jest.fn((x: unknown) => Promise.resolve(x)),
    };
    const managerMock = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Inventory ? invRepo : movementRepo,
      ),
    };
    const dataSource = {
      transaction: jest.fn((cb: (m: unknown) => unknown) => cb(managerMock)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReturnsService,
        {
          provide: SalesReturnRepository,
          useValue: {
            create: jest.fn((input: Partial<SalesReturn>) => input),
            save: jest.fn((entity: Partial<SalesReturn>) =>
              Promise.resolve({ id: RETURN_ID, ...entity } as SalesReturn),
            ),
            returnedQtyBySale: jest.fn().mockResolvedValue(new Map()),
            listReturns: jest.fn(),
          },
        },
        {
          provide: PosService,
          useValue: { findOneById: jest.fn(), findByInvoiceNumber: jest.fn() },
        },
        {
          provide: AccountingService,
          useValue: { createLedgerEntryWithManager: jest.fn() },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(ReturnsService);
    returnsRepo = moduleRef.get(SalesReturnRepository);
    sales = moduleRef.get(PosService);
    accounting = moduleRef.get(AccountingService);
  });

  it('restocks good units and logs bad units as a Damage movement', async () => {
    sales.findOneById.mockResolvedValue(makeSale() as never);

    await service.createReturn(MANAGER, baseDto);

    // Good units → sellable stock bumped + a Return movement.
    expect(invRepo.save).toHaveBeenCalledTimes(1); // only the restock, not damage
    expect(movementRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        movementType: 'Return',
        qtyIn: 1,
        qtyOut: 0,
        balanceAfter: 11,
        refType: 'SalesReturn',
      }),
    );
    // Bad units → an audit Damage movement, sellable stock unchanged.
    expect(movementRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        movementType: 'Damage',
        qtyIn: 2,
        qtyOut: 0,
        balanceAfter: 11,
        refType: 'SalesReturn',
      }),
    );
  });

  it('refunds on the discounted line price and posts a DEBIT', async () => {
    sales.findOneById.mockResolvedValue(makeSale() as never);

    await service.createReturn(MANAGER, baseDto);

    // 3 units × (lineTotal 2700 / qty 3 = 900) = 2700, not 3 × unitPrice 1000.
    expect(returnsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ totalRefundAmount: 2700, restockedValue: 900 }),
    );
    expect(accounting.createLedgerEntryWithManager).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entryType: LedgerEntryType.DEBIT,
        amount: 2700,
      }),
    );
  });

  it('rejects a return that exceeds the remaining quantity', async () => {
    sales.findOneById.mockResolvedValue(makeSale() as never);
    returnsRepo.returnedQtyBySale.mockResolvedValue(new Map([['si-1', 3]]));

    await expect(service.createReturn(MANAGER, baseDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(movementRepo.save).not.toHaveBeenCalled();
  });

  describe('listReturns scoping', () => {
    beforeEach(() => {
      returnsRepo.listReturns.mockResolvedValue({ items: [], total: 0 });
    });

    it('pins a cashier to their own returns, ignoring a requested cashierId', async () => {
      await service.listReturns(CASHIER, { cashierId: 'someone-else' });

      expect(returnsRepo.listReturns).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A, cashierId: CASHIER.id }),
      );
    });

    it('rejects a cashier/manager reaching another branch', async () => {
      await expect(
        service.listReturns(CASHIER, { branchId: BRANCH_B }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.listReturns(MANAGER, { branchId: BRANCH_B }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('scopes a manager to their branch with an optional cashier filter', async () => {
      await service.listReturns(MANAGER, { cashierId: CASHIER.id });

      expect(returnsRepo.listReturns).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: BRANCH_A, cashierId: CASHIER.id }),
      );
    });

    it('lets an admin see all branches, honoring optional filters', async () => {
      await service.listReturns(ADMIN, {});
      expect(returnsRepo.listReturns).toHaveBeenLastCalledWith(
        expect.objectContaining({ branchId: null, cashierId: null }),
      );

      await service.listReturns(ADMIN, {
        branchId: BRANCH_B,
        cashierId: 'c-9',
      });
      expect(returnsRepo.listReturns).toHaveBeenLastCalledWith(
        expect.objectContaining({ branchId: BRANCH_B, cashierId: 'c-9' }),
      );
    });
  });
});
