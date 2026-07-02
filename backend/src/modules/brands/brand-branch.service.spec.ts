import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BrandBranchService } from '@/modules/brands/brand-branch.service';
import { BrandBranchRepository } from '@/modules/brands/brand-branch.repository';
import { BrandRepository } from '@/modules/brands/brands.repository';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';

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
  branchId: 'br-1',
};

const range = { startDate: '2026-06-01', endDate: '2026-06-03' };
const BRANCHES = [
  { branchId: 'br-1', branchName: 'Colombo' },
  { branchId: 'br-2', branchName: 'Kandy' },
];

describe('BrandBranchService', () => {
  let service: BrandBranchService;
  let brands: { findById: jest.Mock };
  let branchData: {
    findBranchesByIds: jest.Mock;
    brandRoster: jest.Mock;
    brandBranchBreakdown: jest.Mock;
    brandSummary: jest.Mock;
    countBrandProducts: jest.Mock;
    brandProductsRosterPage: jest.Mock;
    productsBranchBreakdown: jest.Mock;
    brandTrendByBranch: jest.Mock;
  };

  beforeEach(async () => {
    brands = { findById: jest.fn() };
    branchData = {
      findBranchesByIds: jest.fn().mockResolvedValue(BRANCHES),
      brandRoster: jest.fn().mockResolvedValue([]),
      brandBranchBreakdown: jest.fn().mockResolvedValue([]),
      brandSummary: jest.fn().mockResolvedValue({
        units: 0,
        revenue: 0,
        profit: 0,
        transactions: 0,
      }),
      countBrandProducts: jest.fn().mockResolvedValue(0),
      brandProductsRosterPage: jest.fn().mockResolvedValue([]),
      productsBranchBreakdown: jest.fn().mockResolvedValue([]),
      brandTrendByBranch: jest.fn().mockResolvedValue([]),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        BrandBranchService,
        { provide: BrandRepository, useValue: brands },
        { provide: BrandBranchRepository, useValue: branchData },
      ],
    }).compile();
    service = moduleRef.get(BrandBranchService);
  });

  describe('branch resolution (RBAC)', () => {
    it('rejects an admin request without branchIds', async () => {
      await expect(service.getComparison(admin, { ...range })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('passes the admin selection through, deduped', async () => {
      await service.getComparison(admin, {
        ...range,
        branchIds: ['br-1', 'br-2', 'br-1'],
      });
      expect(branchData.findBranchesByIds).toHaveBeenCalledWith([
        'br-1',
        'br-2',
      ]);
    });

    it("always includes the manager's own branch and dedups extras", async () => {
      await service.getComparison(manager, {
        ...range,
        branchIds: ['br-2', 'br-1'],
      });
      expect(branchData.findBranchesByIds).toHaveBeenCalledWith([
        'br-1',
        'br-2',
      ]);
    });

    it('lets a manager omit branchIds entirely (own branch only)', async () => {
      branchData.findBranchesByIds.mockResolvedValue([BRANCHES[0]]);
      const res = await service.getComparison(manager, { ...range });
      expect(branchData.findBranchesByIds).toHaveBeenCalledWith(['br-1']);
      expect(res.branches).toEqual([BRANCHES[0]]);
    });

    it('rejects a manager with no branch assignment', async () => {
      const unassigned = { ...manager, branchId: null };
      await expect(
        service.getComparison(unassigned, { ...range }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when any requested branch does not exist', async () => {
      branchData.findBranchesByIds.mockResolvedValue([BRANCHES[0]]);
      await expect(
        service.getComparison(admin, {
          ...range,
          branchIds: ['br-1', 'missing'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an inverted date range', async () => {
      await expect(
        service.getComparison(admin, {
          startDate: '2026-06-30',
          endDate: '2026-06-01',
          branchIds: ['br-1'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getComparison', () => {
    it('assembles zero-filled rows and computes totals, margin, and share', async () => {
      branchData.brandRoster.mockResolvedValue([
        {
          brandId: 'b1',
          brandName: 'Prima',
          color: '#1',
          units: 10,
          revenue: 1500,
          profit: 300,
          transactions: 5,
        },
        {
          brandId: null,
          brandName: 'Unbranded',
          color: null,
          units: 5,
          revenue: 500,
          profit: 50,
          transactions: 3,
        },
      ]);
      branchData.brandBranchBreakdown.mockResolvedValue([
        { brandId: 'b1', branchId: 'br-1', units: 10, revenue: 1500, profit: 300 },
        { brandId: null, branchId: 'br-2', units: 5, revenue: 500, profit: 50 },
      ]);

      const res = await service.getComparison(admin, {
        ...range,
        branchIds: ['br-1', 'br-2'],
      });

      expect(res.totalRevenue).toBe(2000);
      expect(res.totalTransactions).toBe(8);
      expect(res.marginPct).toBe(17.5);

      const [prima, unbranded] = res.rows;
      expect(prima.marginPct).toBe(20);
      expect(prima.sharePct).toBe(75);
      // Prima never sold in Kandy — genuine zero cell in branch order.
      expect(prima.perBranch).toEqual([
        { branchId: 'br-1', revenue: 1500, units: 10, profit: 300 },
        { branchId: 'br-2', revenue: 0, units: 0, profit: 0 },
      ]);
      expect(unbranded.brandId).toBeNull();
      expect(unbranded.perBranch[1].revenue).toBe(500);

      // Reconciliation: each branch's cells across rows sum to its own total.
      const branchTotal = (branchId: string) =>
        res.rows.reduce(
          (s, r) =>
            s + (r.perBranch.find((c) => c.branchId === branchId)?.revenue ?? 0),
          0,
        );
      expect(branchTotal('br-1')).toBe(1500);
      expect(branchTotal('br-2')).toBe(500);
    });
  });

  describe('getProducts', () => {
    it('404s on an unknown brand', async () => {
      brands.findById.mockResolvedValue(null);
      await expect(
        service.getProducts(admin, {
          ...range,
          branchIds: ['br-1', 'br-2'],
          brandId: 'nope',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('skips the breakdown query when the page is empty', async () => {
      brands.findById.mockResolvedValue({ id: 'b1', name: 'Prima', color: '#1' });
      const res = await service.getProducts(admin, {
        ...range,
        branchIds: ['br-1', 'br-2'],
        brandId: 'b1',
      });
      expect(branchData.productsBranchBreakdown).not.toHaveBeenCalled();
      expect(res.items).toEqual([]);
      expect(res.sort).toBe('revenue');
      expect(res.page).toBe(1);
    });

    it('returns KPI totals and per-item margin/share against the brand summary', async () => {
      brands.findById.mockResolvedValue({ id: 'b1', name: 'Prima', color: '#1' });
      branchData.brandSummary.mockResolvedValue({
        units: 20,
        revenue: 4000,
        profit: 800,
        transactions: 9,
      });
      branchData.countBrandProducts.mockResolvedValue(1);
      branchData.brandProductsRosterPage.mockResolvedValue([
        {
          productId: 'p1',
          productName: 'White Bread',
          units: 10,
          revenue: 1000,
          profit: 100,
        },
      ]);
      branchData.productsBranchBreakdown.mockResolvedValue([
        { productId: 'p1', branchId: 'br-2', units: 10, revenue: 1000, profit: 100 },
      ]);

      const res = await service.getProducts(admin, {
        ...range,
        branchIds: ['br-1', 'br-2'],
        brandId: 'b1',
        sort: 'units',
      });

      expect(res.totalRevenue).toBe(4000);
      expect(res.marginPct).toBe(20);
      expect(res.sort).toBe('units');
      expect(res.items[0].marginPct).toBe(10);
      expect(res.items[0].sharePct).toBe(25);
      expect(res.items[0].perBranch[0].revenue).toBe(0);
      expect(res.items[0].perBranch[1].revenue).toBe(1000);
    });
  });

  describe('getTrend', () => {
    it('returns one continuous zero-filled series per branch', async () => {
      brands.findById.mockResolvedValue({ id: 'b1', name: 'Prima', color: '#1' });
      branchData.brandTrendByBranch.mockResolvedValue([
        { branchId: 'br-1', date: '2026-06-02', revenue: 700, units: 7 },
      ]);

      const res = await service.getTrend(admin, {
        ...range,
        branchIds: ['br-1', 'br-2'],
        brandId: 'b1',
      });

      expect(res.series.map((s) => s.branchId)).toEqual(['br-1', 'br-2']);
      const [colombo, kandy] = res.series;
      expect(colombo.points.map((p) => p.date)).toEqual([
        '2026-06-01',
        '2026-06-02',
        '2026-06-03',
      ]);
      expect(colombo.points[1].revenue).toBe(700);
      expect(colombo.points[0].revenue).toBe(0);
      // A branch with no sales still gets a full zero line, not a missing series.
      expect(kandy.points).toHaveLength(3);
      expect(kandy.points.every((p) => p.revenue === 0)).toBe(true);
    });
  });
});
