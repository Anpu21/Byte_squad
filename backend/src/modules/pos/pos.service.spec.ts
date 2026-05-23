/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';
import { AccountingRepository } from '@accounting/accounting.repository';
import { InventoryRepository } from '@inventory/inventory.repository';
import { ProductsRepository } from '@products/products.repository';
import { InvoiceNumberService } from './services/invoice-number.service';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { Sale } from './entities/sale.entity';
import { TransactionType } from '@common/enums/transaction.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { PaymentMethod } from '@common/enums/payment-method';
import { UserRole } from '@common/enums/user-roles.enums';

/**
 * Phase 4 — Shanel-aligned read endpoints. Each describe block targets one
 * service method; the underlying repositories are mocked so the spec stays
 * unit-scoped (no DB). The legacy write/dashboard paths already have
 * their own coverage at the repository and entity level.
 */

interface ActorPayload {
  id: string;
  email: string;
  role: UserRole;
  branchId: string | null;
}

function makeCashier(overrides: Partial<ActorPayload> = {}): ActorPayload {
  return {
    id: 'cashier-1',
    email: 'cashier@example.com',
    role: UserRole.CASHIER,
    branchId: 'branch-A',
    ...overrides,
  };
}

function makeAdmin(overrides: Partial<ActorPayload> = {}): ActorPayload {
  return {
    id: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    branchId: 'branch-A',
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p-1',
    name: 'Test Product',
    barcode: 'BC-001',
    description: null,
    category: 'general',
    costPrice: 50,
    sellingPrice: 100,
    wholesalePrice: 80,
    taxRate: 10,
    discountAllowed: true,
    baseUnit: 'each',
    imageUrl: null,
    isActive: true,
    inventoryRecords: [],
    transactionItems: [],
    createdAt: new Date('2026-05-23T10:00:00Z'),
    updatedAt: new Date('2026-05-23T10:00:00Z'),
    ...overrides,
  } as Product;
}

function makeUnit(
  overrides: Partial<ProductSellableUnit> = {},
): ProductSellableUnit {
  return {
    id: 'u-1',
    productId: 'p-1',
    product: undefined as unknown as Product,
    name: 'each',
    isBase: true,
    conversionToBase: 1,
    displayOrder: 0,
    createdAt: new Date('2026-05-23T10:00:00Z'),
    updatedAt: new Date('2026-05-23T10:00:00Z'),
    ...overrides,
  } as ProductSellableUnit;
}

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-1',
    transactionNumber: 'TXN-001',
    invoiceNumber: 'INV-2026-000001',
    billPrinted: false,
    billPrintCount: 0,
    firstPrintDate: null,
    lastPrintDate: null,
    branchId: 'branch-A',
    branch: undefined as unknown as Sale['branch'],
    cashierId: 'cashier-1',
    cashier: undefined as unknown as Sale['cashier'],
    type: TransactionType.SALE,
    subtotal: 100,
    discountAmount: 0,
    discountType: DiscountType.NONE,
    taxAmount: 0,
    total: 100,
    paymentMethod: PaymentMethod.CASH,
    saleType: 'Retail',
    priceLevel: 'Retail',
    discountPercentage: 0,
    taxRate: 0,
    paidAmount: 100,
    balanceDue: 0,
    paymentStatus: 'Paid',
    status: 'Active',
    location: 'Shop',
    customerUserId: null,
    customer: null,
    voidedReason: null,
    voidedAt: null,
    voidedByUserId: null,
    items: [],
    createdAt: new Date('2026-05-23T11:00:00Z'),
    ...overrides,
  } as Sale;
}

describe('PosService — Phase 4 read endpoints', () => {
  let service: PosService;
  let productsRepo: jest.Mocked<ProductsRepository>;
  let inventoryRepo: jest.Mocked<InventoryRepository>;
  let posRepo: jest.Mocked<PosRepository>;
  let invoiceNumbers: jest.Mocked<InvoiceNumberService>;

  beforeEach(async () => {
    const posRepoMock: Partial<jest.Mocked<PosRepository>> = {
      findRecentSales: jest.fn(),
    };
    const accountingRepoMock = {} as AccountingRepository;
    const dataSourceMock = {} as DataSource;
    const productsRepoMock: Partial<jest.Mocked<ProductsRepository>> = {
      searchByText: jest.fn(),
      listUnits: jest.fn(),
    };
    const inventoryRepoMock: Partial<jest.Mocked<InventoryRepository>> = {
      summaryForProduct: jest.fn(),
    };
    const invoiceNumbersMock: Partial<jest.Mocked<InvoiceNumberService>> = {
      peek: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PosRepository, useValue: posRepoMock },
        { provide: AccountingRepository, useValue: accountingRepoMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: ProductsRepository, useValue: productsRepoMock },
        { provide: InventoryRepository, useValue: inventoryRepoMock },
        { provide: InvoiceNumberService, useValue: invoiceNumbersMock },
      ],
    }).compile();

    service = module.get(PosService);
    productsRepo = module.get(ProductsRepository);
    inventoryRepo = module.get(InventoryRepository);
    posRepo = module.get(PosRepository);
    invoiceNumbers = module.get(InvoiceNumberService);
  });

  // -------------------------------------------------------------------
  // Task 4.1 — searchProducts
  // -------------------------------------------------------------------
  describe('searchProducts', () => {
    it('returns an empty array when the trimmed query is empty', async () => {
      const result = await service.searchProducts(makeCashier(), {
        q: '   ',
        limit: 10,
      });
      expect(result).toEqual([]);
      expect(productsRepo.searchByText).not.toHaveBeenCalled();
    });

    it('maps Product rows into the Shanel SearchProductRow shape, propagating baseUnit', async () => {
      productsRepo.searchByText.mockResolvedValue([
        makeProduct({
          id: 'p-1',
          name: 'Apple',
          barcode: '0001',
          category: 'produce',
          costPrice: 40,
          sellingPrice: 100,
          wholesalePrice: 80,
          taxRate: 10,
          discountAllowed: true,
          baseUnit: 'kg',
          imageUrl: 'https://cdn/apple.jpg',
        }),
      ]);

      const result = await service.searchProducts(makeCashier(), {
        q: 'app',
        limit: 5,
      });

      expect(productsRepo.searchByText).toHaveBeenCalledWith('app', 5);
      expect(result).toEqual([
        {
          productId: 'p-1',
          productCode: '0001',
          productName: 'Apple',
          productType: 'produce',
          baseUnit: 'kg',
          status: true,
          costPrice: 40,
          retailPrice: 100,
          wholesalePrice: 80,
          taxRate: 10,
          discountAllowed: true,
          imageUrl: 'https://cdn/apple.jpg',
        },
      ]);
    });

    it('defaults limit to 10 when omitted by the caller', async () => {
      productsRepo.searchByText.mockResolvedValue([]);
      await service.searchProducts(makeCashier(), { q: 'tea' });
      expect(productsRepo.searchByText).toHaveBeenCalledWith('tea', 10);
    });
  });

  // -------------------------------------------------------------------
  // Task 4.2 — listProductUnits
  // -------------------------------------------------------------------
  describe('listProductUnits', () => {
    it('maps repository rows into ProductUnitRow shape, preserving order', async () => {
      productsRepo.listUnits.mockResolvedValue([
        makeUnit({
          id: 'u1',
          name: 'kg',
          isBase: true,
          conversionToBase: 1,
          displayOrder: 0,
        }),
        makeUnit({
          id: 'u2',
          name: 'g',
          isBase: false,
          conversionToBase: 0.001,
          displayOrder: 1,
        }),
      ]);

      const result = await service.listProductUnits('p-1');

      expect(productsRepo.listUnits).toHaveBeenCalledWith('p-1');
      expect(result).toEqual([
        {
          unitId: 'u1',
          unitName: 'kg',
          isBaseUnit: true,
          conversionToBase: 1,
          displayOrder: 0,
        },
        {
          unitId: 'u2',
          unitName: 'g',
          isBaseUnit: false,
          conversionToBase: 0.001,
          displayOrder: 1,
        },
      ]);
    });

    it('returns an empty array when the product has no configured units', async () => {
      productsRepo.listUnits.mockResolvedValue([]);
      const result = await service.listProductUnits('p-1');
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------
  // Task 4.3 — getBaseUnitQty
  // -------------------------------------------------------------------
  describe('getBaseUnitQty', () => {
    it('returns the conversion factor and isBase flag for a configured unit', async () => {
      productsRepo.listUnits.mockResolvedValue([
        makeUnit({ name: 'kg', isBase: true, conversionToBase: 1 }),
        makeUnit({
          id: 'u2',
          name: 'g',
          isBase: false,
          conversionToBase: 0.001,
        }),
      ]);

      const result = await service.getBaseUnitQty('p-1', 'g');

      expect(result).toEqual({ conversionToBase: 0.001, isBase: false });
    });

    it('throws NotFoundException when the unit name is not configured', async () => {
      productsRepo.listUnits.mockResolvedValue([
        makeUnit({ name: 'kg', isBase: true, conversionToBase: 1 }),
      ]);

      await expect(service.getBaseUnitQty('p-1', 'lb')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------
  // Task 4.4 — getProductInventory
  // -------------------------------------------------------------------
  describe('getProductInventory', () => {
    it('scopes a cashier to their own branch and surfaces the cross-branch total', async () => {
      inventoryRepo.summaryForProduct.mockResolvedValue({
        productId: 'p-1',
        branchId: 'branch-A',
        branchName: 'Branch A',
        branchQty: 12,
        totalAcrossBranches: 47,
      });

      const result = await service.getProductInventory(makeCashier(), 'p-1');

      expect(inventoryRepo.summaryForProduct).toHaveBeenCalledWith(
        'p-1',
        'branch-A',
      );
      expect(result).toEqual({
        productId: 'p-1',
        branchId: 'branch-A',
        branchName: 'Branch A',
        branchQty: 12,
        totalAcrossBranches: 47,
      });
    });

    it('lets an admin pull another branch row via their assigned branchId', async () => {
      inventoryRepo.summaryForProduct.mockResolvedValue({
        productId: 'p-1',
        branchId: 'branch-B',
        branchName: 'Branch B',
        branchQty: 30,
        totalAcrossBranches: 47,
      });

      const result = await service.getProductInventory(
        makeAdmin({ branchId: 'branch-B' }),
        'p-1',
      );

      expect(inventoryRepo.summaryForProduct).toHaveBeenCalledWith(
        'p-1',
        'branch-B',
      );
      expect(result.branchQty).toBe(30);
      expect(result.totalAcrossBranches).toBe(47);
    });
  });

  // -------------------------------------------------------------------
  // Task 4.5 — getRecentSales
  // -------------------------------------------------------------------
  describe('getRecentSales', () => {
    it('scopes a cashier to their branch and maps Sale rows into RecentSaleRow, surfacing invoice and print columns', async () => {
      const sale = makeSale({
        id: 'sale-1',
        transactionNumber: 'TXN-001',
        invoiceNumber: 'INV-2026-000007',
        billPrinted: true,
        billPrintCount: 2,
        total: 250,
        paidAmount: 250,
        balanceDue: 0,
        paymentStatus: 'Paid',
        saleType: 'Retail',
        status: 'Active',
        branchId: 'branch-A',
      });
      posRepo.findRecentSales.mockResolvedValue([sale]);

      const result = await service.getRecentSales(makeCashier(), 5);

      expect(posRepo.findRecentSales).toHaveBeenCalledWith('branch-A', 5);
      expect(result).toEqual([
        {
          id: 'sale-1',
          invoiceNumber: 'INV-2026-000007',
          transactionNumber: 'TXN-001',
          total: 250,
          paidAmount: 250,
          balanceDue: 0,
          paymentStatus: 'Paid',
          saleType: 'Retail',
          status: 'Active',
          billPrinted: true,
          billPrintCount: 2,
          branchId: 'branch-A',
          customerUserId: null,
          customerName: null,
          createdAt: sale.createdAt,
        },
      ]);
    });

    it('passes branchId=null when the actor is an admin', async () => {
      posRepo.findRecentSales.mockResolvedValue([]);
      await service.getRecentSales(makeAdmin());
      expect(posRepo.findRecentSales).toHaveBeenCalledWith(null, 20);
    });

    it('populates customerName from the eager-loaded customer relation', async () => {
      posRepo.findRecentSales.mockResolvedValue([
        makeSale({
          id: 'sale-2',
          customerUserId: 'u-7',
          customer: {
            firstName: 'Asha',
            lastName: 'Perera',
          } as unknown as Sale['customer'],
        }),
      ]);

      const result = await service.getRecentSales(makeCashier());

      expect(result[0].customerName).toBe('Asha Perera');
      expect(result[0].customerUserId).toBe('u-7');
    });
  });

  // -------------------------------------------------------------------
  // Task 4.6 — previewNextInvoiceNumber
  // -------------------------------------------------------------------
  describe('previewNextInvoiceNumber', () => {
    it('returns the formatted next invoice number for the current year', async () => {
      const year = new Date().getFullYear();
      invoiceNumbers.peek.mockResolvedValue(`INV-${year}-000042`);

      const result = await service.previewNextInvoiceNumber();

      expect(invoiceNumbers.peek).toHaveBeenCalledWith(year);
      expect(result).toEqual({ invoiceNo: `INV-${year}-000042` });
      expect(result.invoiceNo).toMatch(/^INV-\d{4}-\d{6}$/);
    });
  });
});
