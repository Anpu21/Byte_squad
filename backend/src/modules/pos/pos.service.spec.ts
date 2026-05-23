/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';
import { AccountingRepository } from '@accounting/accounting.repository';
import { ProductsRepository } from '@products/products.repository';
import { Product } from '@products/entities/product.entity';
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
    imageUrl: null,
    isActive: true,
    inventoryRecords: [],
    transactionItems: [],
    createdAt: new Date('2026-05-23T10:00:00Z'),
    updatedAt: new Date('2026-05-23T10:00:00Z'),
    ...overrides,
  } as Product;
}

describe('PosService — Phase 4 read endpoints', () => {
  let service: PosService;
  let productsRepo: jest.Mocked<ProductsRepository>;

  beforeEach(async () => {
    const posRepoMock = {} as PosRepository;
    const accountingRepoMock = {} as AccountingRepository;
    const dataSourceMock = {} as DataSource;
    const productsRepoMock: Partial<jest.Mocked<ProductsRepository>> = {
      searchByText: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PosRepository, useValue: posRepoMock },
        { provide: AccountingRepository, useValue: accountingRepoMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: ProductsRepository, useValue: productsRepoMock },
      ],
    }).compile();

    service = module.get(PosService);
    productsRepo = module.get(ProductsRepository);
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

    it('maps Product rows into the Shanel SearchProductRow shape', async () => {
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
          baseUnit: 'each',
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
});
