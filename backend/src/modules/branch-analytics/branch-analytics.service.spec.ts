/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Branch } from '@branches/entities/branch.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import { LoyaltySettingsService } from '@/modules/loyalty/loyalty-settings.service';
import { BranchAnalyticsRepository } from './branch-analytics.repository';
import { BranchAnalyticsProductsRepository } from './branch-analytics-products.repository';
import { BranchAnalyticsService } from './branch-analytics.service';
import type {
  BranchAnalyticsComparisonResponse,
  BranchAnalyticsProductsResponse,
} from './types';

const ADMIN = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  branchId: null,
};

const MANAGER = {
  id: 'manager-1',
  role: UserRole.MANAGER,
  branchId: 'branch-own',
};

function makeBranch(id: string, name = id): Branch {
  return { id, name } as Branch;
}

function makeResponse(): BranchAnalyticsComparisonResponse {
  return {
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-03T23:59:59.999Z',
    branches: [],
    totals: {
      financial: {
        revenue: 0,
        expenses: 0,
        grossProfit: 0,
        expenseRatio: 0,
      },
      sales: {
        transactionCount: 0,
        avgTransactionValue: 0,
        discountTotal: 0,
        taxTotal: 0,
      },
      inventory: {
        activeProducts: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalStockQuantity: 0,
      },
      loyalty: {
        activeMembers: 0,
        pointsEarned: 0,
        pointsRedeemed: 0,
        pointsReversed: 0,
        liabilityValue: 0,
        tierCounts: { bronze: 0, silver: 0, gold: 0 },
        channelSplit: {
          physicalEvents: 0,
          onlineEvents: 0,
          physicalPoints: 0,
          onlinePoints: 0,
        },
      },
      customers: {
        pickupOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        rejectedOrders: 0,
        uniqueCustomers: 0,
      },
      payments: {
        cashAmount: 0,
        cardAmount: 0,
        mobileAmount: 0,
        chequeAmount: 0,
        bankAmount: 0,
        creditAmount: 0,
      },
      staff: { staffCount: 0, revenuePerStaff: 0 },
    },
  };
}

function makeProductsResponse(): BranchAnalyticsProductsResponse {
  return {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    branches: [],
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-03T23:59:59.999Z',
    sort: 'revenue',
  };
}

describe('BranchAnalyticsService', () => {
  let service: BranchAnalyticsService;
  let repo: jest.Mocked<BranchAnalyticsRepository>;
  let products: jest.Mocked<BranchAnalyticsProductsRepository>;
  let loyaltySettings: jest.Mocked<LoyaltySettingsService>;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<BranchAnalyticsRepository>> = {
      findBranchesByIds: jest.fn(),
      getComparison: jest.fn().mockResolvedValue(makeResponse()),
      listBranches: jest.fn(),
    };
    const productsRepoMock: Partial<
      jest.Mocked<BranchAnalyticsProductsRepository>
    > = {
      getProductComparison: jest.fn().mockResolvedValue(makeProductsResponse()),
    };
    const loyaltySettingsMock: Partial<jest.Mocked<LoyaltySettingsService>> = {
      get: jest.fn().mockResolvedValue({
        pointValue: 1,
        silverTierPoints: 1000,
        goldTierPoints: 5000,
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        BranchAnalyticsService,
        { provide: BranchAnalyticsRepository, useValue: repoMock },
        {
          provide: BranchAnalyticsProductsRepository,
          useValue: productsRepoMock,
        },
        {
          provide: LoyaltySettingsService,
          useValue: loyaltySettingsMock,
        },
      ],
    }).compile();

    service = module.get(BranchAnalyticsService);
    repo = module.get(BranchAnalyticsRepository);
    products = module.get(BranchAnalyticsProductsRepository);
    loyaltySettings = module.get(LoyaltySettingsService);
  });

  it('requires admins to provide at least one branch', async () => {
    await expect(
      service.compareBranches(ADMIN, {
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-03T23:59:59.999Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('always includes the manager branch first', async () => {
    repo.findBranchesByIds.mockResolvedValue([
      makeBranch('branch-own'),
      makeBranch('branch-peer'),
    ]);

    await service.compareBranches(MANAGER, {
      branchIds: ['branch-peer'],
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-03T23:59:59.999Z',
    });

    expect(repo.findBranchesByIds).toHaveBeenCalledWith([
      'branch-own',
      'branch-peer',
    ]);
    expect(repo.getComparison).toHaveBeenCalledWith(
      expect.objectContaining({
        ownBranchId: 'branch-own',
      }),
    );
  });

  it('rejects unknown branch ids', async () => {
    repo.findBranchesByIds.mockResolvedValue([makeBranch('branch-1')]);

    await expect(
      service.compareBranches(ADMIN, {
        branchIds: ['branch-1', 'missing'],
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-03T23:59:59.999Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects reversed date ranges', async () => {
    await expect(
      service.compareBranches(ADMIN, {
        branchIds: ['branch-1'],
        startDate: '2026-06-04T00:00:00.000Z',
        endDate: '2026-06-03T23:59:59.999Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires managers to be assigned to a branch', async () => {
    await expect(
      service.compareBranches(
        { ...MANAGER, branchId: null },
        {
          branchIds: ['branch-peer'],
          startDate: '2026-06-01T00:00:00.000Z',
          endDate: '2026-06-03T23:59:59.999Z',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('passes loyalty tier settings and protects zero point value', async () => {
    repo.findBranchesByIds.mockResolvedValue([makeBranch('branch-1')]);
    loyaltySettings.get.mockResolvedValue({
      id: 'default',
      earnPoints: 1,
      earnPerAmount: 100,
      pointValue: 0,
      redeemCapPercent: 20,
      minRedeemablePoints: 100,
      silverTierPoints: 2500,
      goldTierPoints: 10000,
      updatedByUserId: null,
      updatedAt: new Date('2026-06-03T00:00:00.000Z'),
    });

    await service.compareBranches(ADMIN, {
      branchIds: ['branch-1'],
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-03T23:59:59.999Z',
      sections: ['financial', 'loyalty'],
    });

    expect(repo.getComparison).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: {
          pointValue: 1,
          silverTierPoints: 2500,
          goldTierPoints: 10000,
        },
      }),
    );
  });

  it('forwards the opt-in trend section to the repository', async () => {
    repo.findBranchesByIds.mockResolvedValue([makeBranch('branch-1')]);

    await service.compareBranches(ADMIN, {
      branchIds: ['branch-1'],
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-03T23:59:59.999Z',
      sections: ['financial', 'sales', 'trend'],
    });

    const params = repo.getComparison.mock.calls[0][0];
    expect(params.sections.has('trend')).toBe(true);
  });

  it('omits trend by default (table sub-tabs never pay for it)', async () => {
    repo.findBranchesByIds.mockResolvedValue([makeBranch('branch-1')]);

    await service.compareBranches(ADMIN, {
      branchIds: ['branch-1'],
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-03T23:59:59.999Z',
    });

    const params = repo.getComparison.mock.calls[0][0];
    expect(params.sections.has('trend')).toBe(false);
  });

  it('lists every branch (id/name/isActive) for the comparison picker', async () => {
    repo.listBranches.mockResolvedValue([
      { id: 'branch-own', name: 'Main', isActive: true } as Branch,
      { id: 'branch-peer', name: 'Downtown', isActive: false } as Branch,
    ]);

    const result = await service.listBranches();

    expect(result).toEqual([
      { id: 'branch-own', name: 'Main', isActive: true },
      { id: 'branch-peer', name: 'Downtown', isActive: false },
    ]);
  });

  describe('compareProducts', () => {
    const RANGE = {
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-03T23:59:59.999Z',
    };

    it('requires admins to provide at least one branch', async () => {
      await expect(
        service.compareProducts(ADMIN, { ...RANGE }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(products.getProductComparison).not.toHaveBeenCalled();
    });

    it('forces the manager own-branch first and passes search/sort/page through', async () => {
      repo.findBranchesByIds.mockResolvedValue([
        makeBranch('branch-own', 'Main'),
        makeBranch('branch-peer', 'Downtown'),
      ]);

      await service.compareProducts(MANAGER, {
        ...RANGE,
        branchIds: ['branch-peer'],
        search: 'banana',
        sort: 'quantity',
        page: 2,
        limit: 25,
      });

      expect(repo.findBranchesByIds).toHaveBeenCalledWith([
        'branch-own',
        'branch-peer',
      ]);
      expect(products.getProductComparison).toHaveBeenCalledWith(
        expect.objectContaining({
          branches: [
            { branchId: 'branch-own', branchName: 'Main' },
            { branchId: 'branch-peer', branchName: 'Downtown' },
          ],
          search: 'banana',
          sort: 'quantity',
          page: 2,
          limit: 25,
        }),
      );
    });

    it('defaults sort to revenue when omitted', async () => {
      repo.findBranchesByIds.mockResolvedValue([makeBranch('branch-1')]);

      await service.compareProducts(ADMIN, {
        ...RANGE,
        branchIds: ['branch-1'],
      });

      expect(products.getProductComparison).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'revenue' }),
      );
    });

    it('rejects reversed date ranges', async () => {
      await expect(
        service.compareProducts(ADMIN, {
          branchIds: ['branch-1'],
          startDate: '2026-06-04T00:00:00.000Z',
          endDate: '2026-06-03T23:59:59.999Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects unknown branch ids', async () => {
      repo.findBranchesByIds.mockResolvedValue([makeBranch('branch-1')]);
      await expect(
        service.compareProducts(ADMIN, {
          ...RANGE,
          branchIds: ['branch-1', 'missing'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
