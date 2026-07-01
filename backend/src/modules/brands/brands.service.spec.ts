import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BrandsService } from '@/modules/brands/brands.service';
import { BrandRepository } from '@/modules/brands/brands.repository';
import { Brand } from '@/modules/brands/entities/brand.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import type { BrandSalesRow, BrandProductRow } from '@/modules/brands/types';
import { pickBrandColor } from '@/modules/brands/lib/brand-palette';

const admin: AuthUser = {
  id: 'admin-1',
  email: 'admin@x.com',
  role: UserRole.ADMIN,
  branchId: null,
};
const manager: AuthUser = {
  id: 'mgr-1',
  email: 'mgr@x.com',
  role: UserRole.MANAGER,
  branchId: 'branch-1',
};

function makeBrand(over: Partial<Brand> = {}): Brand {
  return {
    id: 'b1',
    name: 'Prima',
    description: null,
    color: '#6366f1',
    isActive: true,
    sortOrder: 0,
    createdByUserId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...over,
  };
}

function salesRow(over: Partial<BrandSalesRow> = {}): BrandSalesRow {
  return {
    brandId: 'b1',
    brandName: 'Prima',
    color: '#1',
    units: 0,
    revenue: 0,
    profit: 0,
    transactions: 0,
    marginPct: 0,
    sharePct: 0,
    ...over,
  };
}

function productRow(over: Partial<BrandProductRow> = {}): BrandProductRow {
  return {
    productId: 'p1',
    productName: 'White Bread',
    units: 0,
    revenue: 0,
    profit: 0,
    marginPct: 0,
    sharePct: 0,
    ...over,
  };
}

describe('BrandsService', () => {
  let service: BrandsService;
  let repo: {
    list: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
    findById: jest.Mock;
    findByName: jest.Mock;
    countProductsForBrand: jest.Mock;
    delete: jest.Mock;
    syncProductBrandName: jest.Mock;
    leaderboard: jest.Mock;
    brandSummary: jest.Mock;
    categoriesForBrand: jest.Mock;
    productsForBrand: jest.Mock;
    brandTrend: jest.Mock;
  };

  const range = { startDate: '2026-06-01', endDate: '2026-06-30' };

  beforeEach(async () => {
    repo = {
      list: jest.fn(),
      create: jest.fn((x: Partial<Brand>) => x as Brand),
      save: jest.fn((x: Brand) =>
        Promise.resolve({ ...x, id: x.id ?? 'new-id' }),
      ),
      count: jest.fn().mockResolvedValue(0),
      findById: jest.fn(),
      findByName: jest.fn(),
      countProductsForBrand: jest.fn().mockResolvedValue(0),
      delete: jest.fn(),
      syncProductBrandName: jest.fn(),
      leaderboard: jest.fn(),
      brandSummary: jest.fn(),
      categoriesForBrand: jest.fn().mockResolvedValue([]),
      productsForBrand: jest.fn().mockResolvedValue([]),
      brandTrend: jest.fn().mockResolvedValue([]),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [BrandsService, { provide: BrandRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(BrandsService);
  });

  describe('create', () => {
    it('trims the name, assigns a palette colour + sortOrder from the count', async () => {
      repo.findByName.mockResolvedValue(null);
      repo.count.mockResolvedValue(3);
      await service.create({ name: '  Nestlé  ' }, admin);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nestlé',
          sortOrder: 3,
          createdByUserId: 'admin-1',
          color: pickBrandColor(3),
        }),
      );
    });

    it('rejects a duplicate name', async () => {
      repo.findByName.mockResolvedValue(makeBrand());
      await expect(service.create({ name: 'Prima' }, admin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects a blank name', async () => {
      await expect(service.create({ name: '   ' }, admin)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('syncs the denormalized product.brand mirror on rename', async () => {
      repo.findById.mockResolvedValue(makeBrand());
      repo.findByName.mockResolvedValue(null);
      repo.save.mockImplementation((b: Brand) => Promise.resolve(b));
      await service.update('b1', { name: 'Prima Foods' });
      expect(repo.syncProductBrandName).toHaveBeenCalledWith(
        'b1',
        'Prima Foods',
      );
    });

    it('does not sync when the name is unchanged', async () => {
      repo.findById.mockResolvedValue(makeBrand());
      repo.save.mockImplementation((b: Brand) => Promise.resolve(b));
      await service.update('b1', { description: 'x' });
      expect(repo.syncProductBrandName).not.toHaveBeenCalled();
    });

    it('throws when the brand is missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('nope', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects renaming onto another brand', async () => {
      repo.findById.mockResolvedValue(makeBrand());
      repo.findByName.mockResolvedValue(makeBrand({ id: 'other' }));
      await expect(service.update('b1', { name: 'Anchor' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('archive', () => {
    it('flips isActive to false', async () => {
      const brand = makeBrand();
      repo.findById.mockResolvedValue(brand);
      repo.save.mockImplementation((b: Brand) => Promise.resolve(b));
      const result = await service.archive('b1');
      expect(result.isActive).toBe(false);
    });

    it('throws when the brand is missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.archive('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getById', () => {
    it('returns the brand with its product count', async () => {
      repo.findById.mockResolvedValue(makeBrand());
      repo.countProductsForBrand.mockResolvedValue(4);
      const res = await service.getById('b1');
      expect(res.name).toBe('Prima');
      expect(res.productCount).toBe(4);
    });

    it('throws when the brand is missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getById('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('hard-deletes a brand no product references', async () => {
      repo.findById.mockResolvedValue(makeBrand());
      repo.countProductsForBrand.mockResolvedValue(0);
      await service.remove('b1');
      expect(repo.delete).toHaveBeenCalledWith('b1');
    });

    it('rejects deleting a brand still used by products', async () => {
      repo.findById.mockResolvedValue(makeBrand());
      repo.countProductsForBrand.mockResolvedValue(2);
      await expect(service.remove('b1')).rejects.toThrow(ConflictException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('throws when the brand is missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOverview', () => {
    it('computes totals, margin %, and per-row share %', async () => {
      repo.leaderboard.mockResolvedValue([
        salesRow({
          brandId: 'b1',
          revenue: 1000,
          profit: 400,
          units: 10,
          transactions: 5,
        }),
        salesRow({
          brandId: 'b2',
          brandName: 'Anchor',
          revenue: 500,
          profit: 100,
          units: 5,
          transactions: 3,
        }),
      ]);
      const res = await service.getOverview(admin, range);
      expect(res.totalRevenue).toBe(1500);
      expect(res.totalProfit).toBe(500);
      expect(res.totalUnits).toBe(15);
      expect(res.totalTransactions).toBe(8);
      expect(res.marginPct).toBeCloseTo(33.3, 1);
      expect(res.rows[0].sharePct).toBeCloseTo(66.7, 1);
      expect(res.rows[0].marginPct).toBe(40);
      expect(res.rows[1].marginPct).toBe(20);
    });

    it('forces a manager to their own branch', async () => {
      repo.leaderboard.mockResolvedValue([]);
      await service.getOverview(manager, range);
      expect(repo.leaderboard).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1' }),
      );
    });

    it('rejects a manager requesting another branch', async () => {
      await expect(
        service.getOverview(manager, { ...range, branchId: 'branch-2' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('passes the admin branch filter through (null = all branches)', async () => {
      repo.leaderboard.mockResolvedValue([]);
      await service.getOverview(admin, range);
      expect(repo.leaderboard).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: null }),
      );
      await service.getOverview(admin, { ...range, branchId: 'branch-9' });
      expect(repo.leaderboard).toHaveBeenLastCalledWith(
        expect.objectContaining({ branchId: 'branch-9' }),
      );
    });

    it('rejects an invalid / inverted date range', async () => {
      await expect(
        service.getOverview(admin, { startDate: 'nope', endDate: 'nope' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getOverview(admin, {
          startDate: '2026-06-30',
          endDate: '2026-06-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBrandAnalytics', () => {
    it('throws when the brand does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.getBrandAnalytics(admin, 'nope', range),
      ).rejects.toThrow(NotFoundException);
    });

    it('computes per-product margin + share and zero-fills the trend', async () => {
      repo.findById.mockResolvedValue(makeBrand());
      repo.brandSummary.mockResolvedValue({
        units: 15,
        revenue: 1500,
        profit: 600,
        transactions: 7,
      });
      repo.productsForBrand.mockResolvedValue([
        productRow({ productId: 'p1', revenue: 1000, profit: 400 }),
        productRow({ productId: 'p2', revenue: 500, profit: 200 }),
      ]);
      repo.brandTrend.mockResolvedValue([
        { date: '2026-06-02', revenue: 300, units: 4 },
      ]);
      repo.categoriesForBrand.mockResolvedValue([
        {
          categoryId: 'c1',
          categoryName: 'Beverages',
          color: '#1',
          units: 15,
          revenue: 1500,
          profit: 600,
          transactions: 7,
          marginPct: 0,
          sharePct: 0,
        },
      ]);

      const res = await service.getBrandAnalytics(admin, 'b1', {
        startDate: '2026-06-01',
        endDate: '2026-06-03',
      });

      expect(res.totalRevenue).toBe(1500);
      expect(res.marginPct).toBe(40);
      expect(res.products[0].marginPct).toBe(40);
      expect(res.products[0].sharePct).toBeCloseTo(66.7, 1);
      // Category breakdown gets margin + share of the brand total.
      expect(res.categories).toHaveLength(1);
      expect(res.categories[0].marginPct).toBe(40);
      expect(res.categories[0].sharePct).toBe(100);
      // 3-day inclusive window, only the middle day has data.
      expect(res.trend).toHaveLength(3);
      expect(res.trend[0]).toEqual({
        date: '2026-06-01',
        revenue: 0,
        units: 0,
      });
      expect(res.trend[1]).toEqual({
        date: '2026-06-02',
        revenue: 300,
        units: 4,
      });
    });

    it('threads the categoryId filter into the product breakdown', async () => {
      repo.findById.mockResolvedValue(makeBrand());
      repo.brandSummary.mockResolvedValue({
        units: 0,
        revenue: 0,
        profit: 0,
        transactions: 0,
      });
      await service.getBrandAnalytics(admin, 'b1', {
        startDate: '2026-06-01',
        endDate: '2026-06-03',
        categoryId: 'cat-1',
      });
      expect(repo.productsForBrand).toHaveBeenCalledWith(
        expect.any(Object),
        'b1',
        'cat-1',
      );
    });
  });
});
