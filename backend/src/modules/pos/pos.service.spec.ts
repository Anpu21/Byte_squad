/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';
import { SaleRepository } from './sale.repository';
import { AccountingService } from '@accounting/accounting.service';
import { InventoryService } from '@inventory/inventory.service';
import { ProductsService } from '@products/products.service';
import { InvoiceNumberService } from './services/invoice-number.service';
import { UsersService } from '@users/users.service';
import { EmailService } from '@/modules/email/email.service';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { Sale } from './entities/sale.entity';
import { User } from '@users/entities/user.entity';
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
    taxRate: 10,
    discountAllowed: true,
    baseUnit: 'unit',
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
    name: 'unit',
    barcode: null,
    isBase: true,
    conversionToBase: 1,
    sellingPrice: 100,
    displayOrder: 0,
    createdAt: new Date('2026-05-23T10:00:00Z'),
    updatedAt: new Date('2026-05-23T10:00:00Z'),
    ...overrides,
  } as ProductSellableUnit;
}

function makeCustomer(overrides: Partial<User> = {}): User {
  return {
    id: 'cust-1',
    email: 'jane@example.com',
    passwordHash: 'hash',
    firstName: 'Jane',
    lastName: 'Doe',
    avatarUrl: null,
    role: UserRole.CUSTOMER,
    branchId: null,
    branch: null,
    phone: '+94770000000',
    address: null,
    isFirstLogin: false,
    otpCode: null,
    otpExpiresAt: null,
    isVerified: true,
    lastLoginAt: null,
    currentBalance: 0,
    createdAt: new Date('2026-05-23T10:00:00Z'),
    updatedAt: new Date('2026-05-23T10:00:00Z'),
    ...overrides,
  } as User;
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
  let productsRepo: jest.Mocked<ProductsService>;
  let inventoryRepo: jest.Mocked<InventoryService>;
  let posRepo: jest.Mocked<PosRepository>;
  let invoiceNumbers: jest.Mocked<InvoiceNumberService>;
  let salesRepo: jest.Mocked<SaleRepository>;
  let usersRepo: jest.Mocked<UsersService>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const posRepoMock: Partial<jest.Mocked<PosRepository>> = {
      findRecentSales: jest.fn(),
    };
    const accountingRepoMock = {} as AccountingService;
    const dataSourceMock = {} as DataSource;
    const productsRepoMock: Partial<jest.Mocked<ProductsService>> = {
      searchByText: jest.fn(),
      findByBarcode: jest.fn(),
      findUnitByBarcode: jest.fn(),
      listUnits: jest.fn(),
    };
    const inventoryRepoMock: Partial<jest.Mocked<InventoryService>> = {
      summaryForProduct: jest.fn(),
    };
    const invoiceNumbersMock: Partial<jest.Mocked<InvoiceNumberService>> = {
      peek: jest.fn(),
    };
    const salesRepoMock: Partial<jest.Mocked<SaleRepository>> = {
      findOneById: jest.fn(),
      markPrinted: jest.fn().mockResolvedValue(undefined),
    };
    const usersRepoMock: Partial<jest.Mocked<UsersService>> = {
      searchCustomersByText: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PosRepository, useValue: posRepoMock },
        { provide: AccountingService, useValue: accountingRepoMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: ProductsService, useValue: productsRepoMock },
        { provide: InventoryService, useValue: inventoryRepoMock },
        { provide: InvoiceNumberService, useValue: invoiceNumbersMock },
        { provide: SaleRepository, useValue: salesRepoMock },
        { provide: UsersService, useValue: usersRepoMock },
        {
          provide: EmailService,
          useValue: {
            isVerified: jest.fn().mockReturnValue(true),
            sendReceiptEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PosService);
    productsRepo = module.get(ProductsService);
    inventoryRepo = module.get(InventoryService);
    posRepo = module.get(PosRepository);
    invoiceNumbers = module.get(InvoiceNumberService);
    salesRepo = module.get(SaleRepository);
    usersRepo = module.get(UsersService);
    emailService = module.get(EmailService);
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
      productsRepo.findByBarcode.mockResolvedValue(null);
      productsRepo.findUnitByBarcode.mockResolvedValue(null);
      productsRepo.searchByText.mockResolvedValue([
        makeProduct({
          id: 'p-1',
          name: 'Apple',
          barcode: '0001',
          category: 'produce',
          costPrice: 40,
          sellingPrice: 100,
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
          taxRate: 10,
          discountAllowed: true,
          imageUrl: 'https://cdn/apple.jpg',
          matchedUnit: null,
        },
      ]);
    });

    it('defaults limit to 10 when omitted by the caller', async () => {
      productsRepo.findByBarcode.mockResolvedValue(null);
      productsRepo.findUnitByBarcode.mockResolvedValue(null);
      productsRepo.searchByText.mockResolvedValue([]);
      await service.searchProducts(makeCashier(), { q: 'tea' });
      expect(productsRepo.searchByText).toHaveBeenCalledWith('tea', 10);
    });

    it('returns a matched sellable unit for an exact unit barcode scan', async () => {
      productsRepo.findByBarcode.mockResolvedValue(null);
      productsRepo.findUnitByBarcode.mockResolvedValue(
        makeUnit({
          id: 'u-pack',
          productId: 'p-eggs',
          product: makeProduct({
            id: 'p-eggs',
            name: 'Eggs',
            barcode: 'EGG-UNIT',
            baseUnit: 'unit',
            sellingPrice: 60,
          }),
          name: '12-PACK',
          barcode: 'EGG-12',
          isBase: false,
          conversionToBase: 12,
          sellingPrice: 650,
        }),
      );
      productsRepo.searchByText.mockResolvedValue([]);

      const result = await service.searchProducts(makeCashier(), {
        q: 'EGG-12',
        limit: 5,
      });

      expect(result[0]).toMatchObject({
        productId: 'p-eggs',
        productCode: 'EGG-UNIT',
        productName: 'Eggs',
        baseUnit: 'unit',
        retailPrice: 60,
        matchedUnit: {
          unitId: 'u-pack',
          unitName: '12-PACK',
          barcode: 'EGG-12',
          conversionToBase: 12,
          sellingPrice: 650,
        },
      });
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
          barcode: null,
          isBase: true,
          conversionToBase: 1,
          sellingPrice: 100,
          displayOrder: 0,
        }),
        makeUnit({
          id: 'u2',
          name: '12-PACK',
          barcode: 'RICE-12',
          isBase: false,
          conversionToBase: 12,
          sellingPrice: 1100,
          displayOrder: 1,
        }),
      ]);

      const result = await service.listProductUnits('p-1');

      expect(productsRepo.listUnits).toHaveBeenCalledWith('p-1');
      expect(result).toEqual([
        {
          unitId: 'u1',
          unitName: 'kg',
          barcode: null,
          isBaseUnit: true,
          conversionToBase: 1,
          sellingPrice: 100,
          displayOrder: 0,
        },
        {
          unitId: 'u2',
          unitName: '12-PACK',
          barcode: 'RICE-12',
          isBaseUnit: false,
          conversionToBase: 12,
          sellingPrice: 1100,
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
          name: '12-PACK',
          isBase: false,
          conversionToBase: 12,
        }),
      ]);

      const result = await service.getBaseUnitQty('p-1', '12-PACK');

      expect(result).toEqual({ conversionToBase: 12, isBase: false });
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

  // -------------------------------------------------------------------
  // Task 6.1 — markPrinted
  // -------------------------------------------------------------------
  describe('markPrinted', () => {
    it('increments billPrintCount, sets firstPrintDate on the first print, and refreshes lastPrintDate', async () => {
      const initial = makeSale({
        id: 'sale-1',
        billPrinted: false,
        billPrintCount: 0,
        firstPrintDate: null,
        lastPrintDate: null,
        branchId: 'branch-A',
      });
      const refreshed = makeSale({
        id: 'sale-1',
        billPrinted: true,
        billPrintCount: 1,
        firstPrintDate: new Date('2026-05-23T12:00:00Z'),
        lastPrintDate: new Date('2026-05-23T12:00:00Z'),
        branchId: 'branch-A',
      });
      salesRepo.findOneById
        .mockResolvedValueOnce(initial)
        .mockResolvedValueOnce(refreshed);

      const result = await service.markPrinted('sale-1', makeCashier());

      expect(salesRepo.markPrinted).toHaveBeenCalledWith(
        'sale-1',
        expect.objectContaining({
          billPrinted: true,
          billPrintCount: 1,
          firstPrintDate: expect.any(Date) as Date,
          lastPrintDate: expect.any(Date) as Date,
        }),
      );
      // firstPrintDate and lastPrintDate match on the first print.
      const patchArg = salesRepo.markPrinted.mock.calls[0][1] as {
        firstPrintDate: Date;
        lastPrintDate: Date;
      };
      expect(patchArg.firstPrintDate.getTime()).toBe(
        patchArg.lastPrintDate.getTime(),
      );
      expect(result).toBe(refreshed);
    });

    it('preserves firstPrintDate on subsequent prints and bumps the count', async () => {
      const original = new Date('2026-05-22T09:00:00Z');
      const initial = makeSale({
        id: 'sale-2',
        billPrinted: true,
        billPrintCount: 2,
        firstPrintDate: original,
        lastPrintDate: new Date('2026-05-22T10:30:00Z'),
        branchId: 'branch-A',
      });
      const refreshed = makeSale({
        id: 'sale-2',
        billPrinted: true,
        billPrintCount: 3,
        firstPrintDate: original,
        lastPrintDate: new Date(),
        branchId: 'branch-A',
      });
      salesRepo.findOneById
        .mockResolvedValueOnce(initial)
        .mockResolvedValueOnce(refreshed);

      await service.markPrinted('sale-2', makeCashier());

      const patchArg = salesRepo.markPrinted.mock.calls[0][1] as {
        billPrintCount: number;
        firstPrintDate: Date;
      };
      expect(patchArg.billPrintCount).toBe(3);
      expect(patchArg.firstPrintDate).toBe(original);
    });

    it('throws NotFoundException when a cashier targets a sale on another branch', async () => {
      const foreign = makeSale({
        id: 'sale-x',
        branchId: 'branch-B',
      });
      salesRepo.findOneById.mockResolvedValue(foreign);

      await expect(
        service.markPrinted('sale-x', makeCashier({ branchId: 'branch-A' })),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(salesRepo.markPrinted).not.toHaveBeenCalled();
    });

    it('lets an admin print a sale that lives on any branch', async () => {
      const onAnotherBranch = makeSale({
        id: 'sale-z',
        branchId: 'branch-B',
        billPrinted: false,
        billPrintCount: 0,
        firstPrintDate: null,
      });
      salesRepo.findOneById
        .mockResolvedValueOnce(onAnotherBranch)
        .mockResolvedValueOnce(onAnotherBranch);

      await service.markPrinted('sale-z', makeAdmin({ branchId: 'branch-A' }));

      expect(salesRepo.markPrinted).toHaveBeenCalledWith(
        'sale-z',
        expect.objectContaining({ billPrinted: true, billPrintCount: 1 }),
      );
    });

    it('throws NotFoundException when no sale matches the id', async () => {
      salesRepo.findOneById.mockResolvedValue(null);
      await expect(
        service.markPrinted('missing', makeCashier()),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(salesRepo.markPrinted).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------
  // emailReceipt — email a PDF copy of the receipt to the customer
  // -------------------------------------------------------------------
  describe('emailReceipt', () => {
    const PDF = 'JVBERi0xLjQK';

    it('emails the receipt to the customer and reports sent', async () => {
      const sale = makeSale({
        id: 'sale-1',
        branchId: 'branch-A',
        invoiceNumber: 'INV-2026-000009',
        total: 1150,
        customerUserId: 'cust-1',
        customer: {
          email: 'nadia@example.com',
          firstName: 'Nadia',
        } as unknown as Sale['customer'],
      });
      salesRepo.findOneById.mockResolvedValue(sale);

      const result = await service.emailReceipt(
        'sale-1',
        { pdfBase64: PDF },
        makeCashier(),
      );

      expect(emailService.sendReceiptEmail).toHaveBeenCalledWith(
        'nadia@example.com',
        'Nadia',
        'INV-2026-000009',
        1150,
        PDF,
      );
      expect(result).toEqual({ sent: true });
    });

    it('rejects when the sale has no customer email', async () => {
      salesRepo.findOneById.mockResolvedValue(
        makeSale({ id: 'sale-1', branchId: 'branch-A', customer: null }),
      );
      await expect(
        service.emailReceipt('sale-1', { pdfBase64: PDF }, makeCashier()),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(emailService.sendReceiptEmail).not.toHaveBeenCalled();
    });

    it('503s when email delivery is not configured', async () => {
      salesRepo.findOneById.mockResolvedValue(
        makeSale({
          id: 'sale-1',
          branchId: 'branch-A',
          customer: {
            email: 'x@y.com',
            firstName: 'X',
          } as unknown as Sale['customer'],
        }),
      );
      emailService.isVerified.mockReturnValueOnce(false);
      await expect(
        service.emailReceipt('sale-1', { pdfBase64: PDF }, makeCashier()),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(emailService.sendReceiptEmail).not.toHaveBeenCalled();
    });

    it('throws NotFoundException across branches for a cashier', async () => {
      salesRepo.findOneById.mockResolvedValue(
        makeSale({ id: 'sale-x', branchId: 'branch-B' }),
      );
      await expect(
        service.emailReceipt(
          'sale-x',
          { pdfBase64: PDF },
          makeCashier({ branchId: 'branch-A' }),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(emailService.sendReceiptEmail).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------
  // Task 9.1 — searchCustomers (Phase 9 cashier customer picker)
  // -------------------------------------------------------------------
  describe('searchCustomers', () => {
    it('returns an empty array when the trimmed query is empty', async () => {
      const result = await service.searchCustomers(makeCashier(), {
        q: '   ',
        limit: 10,
      });
      expect(result).toEqual([]);
      expect(usersRepo.searchCustomersByText).not.toHaveBeenCalled();
    });

    it('maps User rows into the Shanel CustomerSearchRow shape', async () => {
      usersRepo.searchCustomersByText.mockResolvedValue([
        makeCustomer({
          id: 'cust-1',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          phone: '+94770000001',
          // decimal columns return as strings via TypeORM; the service
          // is responsible for coercing back to number.
          currentBalance: '250.50' as unknown as number,
        }),
      ]);

      const result = await service.searchCustomers(makeCashier(), {
        q: 'ja',
        limit: 5,
      });

      expect(usersRepo.searchCustomersByText).toHaveBeenCalledWith('ja', 5);
      expect(result).toEqual([
        {
          userId: 'cust-1',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          phone: '+94770000001',
          currentBalance: 250.5,
        },
      ]);
    });

    it('defaults limit to 10 when omitted and clamps absurd limits to 50', async () => {
      usersRepo.searchCustomersByText.mockResolvedValue([]);

      await service.searchCustomers(makeCashier(), { q: 'a' });
      expect(usersRepo.searchCustomersByText).toHaveBeenLastCalledWith('a', 10);

      // The DTO normally bounds limit to [1, 50] via class-validator at
      // the controller layer; this case exercises the in-service clamp
      // that protects callers (like tests) bypassing the DTO validator.
      await service.searchCustomers(makeCashier(), { q: 'b', limit: 9999 });
      expect(usersRepo.searchCustomersByText).toHaveBeenLastCalledWith('b', 50);
    });
  });
});
