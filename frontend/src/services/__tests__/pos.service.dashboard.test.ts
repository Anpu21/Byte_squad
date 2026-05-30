import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  ICashierDashboard,
  IAdminDashboard,
  ICashierTransactionsSummary,
} from '@/types';

/**
 * Mock the underlying axios instance so we can assert the exact URL and
 * inspect the typed envelope unwrap. Each api method is a thin Axios
 * wrapper, so we shape the mock to return an object whose `data.data`
 * matches the IApiResponse contract.
 */
vi.mock('@/services/api', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
  },
}));

import api from '@/services/api';
import { posService } from '@/services/pos.service';

const getMock = vi.mocked(api.get);

const cashierDashboardFixture: ICashierDashboard = {
  today: { totalSales: 1500, transactionCount: 7, averageSale: 214.29 },
  week: { totalSales: 10_000, transactionCount: 42 },
  dailyBreakdown: [
    { date: '2026-05-18', totalSales: 1200, transactionCount: 5 },
  ],
  recentTransactions: [],
};

const adminDashboardFixture: IAdminDashboard = {
  today: { totalSales: 25_000, transactionCount: 110, averageSale: 227.27 },
  week: { totalSales: 150_000, transactionCount: 620 },
  month: { totalRevenue: 700_000, transactionCount: 2_800 },
  stats: {
    activeProducts: 320,
    lowStockItems: 14,
    totalUsers: 45,
    totalBranches: 4,
  },
  dailyBreakdown: [],
  topProducts: [
    {
      productId: 'p-1',
      productName: 'Sample',
      totalQuantity: 50,
      totalRevenue: 12_500,
    },
  ],
  recentTransactions: [],
};

const transactionsSummaryFixture: ICashierTransactionsSummary = {
  scope: 'branch',
  today: { totalSales: 1500, transactionCount: 7 },
  month: { totalSales: 40_000, transactionCount: 200 },
  year: { totalSales: 500_000, transactionCount: 2_500 },
  recentTransactions: [
    {
      id: 't-1',
      transactionNumber: 'TX-001',
      total: 250,
      itemCount: 3,
      cashierName: 'Alice',
      branchName: 'Main',
      createdAt: new Date('2026-05-24T10:00:00Z').toISOString(),
    },
  ],
};

describe('posService dashboard + transactions endpoints', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('getCashierDashboard hits /pos/my-dashboard and unwraps data', async () => {
    getMock.mockResolvedValueOnce({
      data: { success: true, data: cashierDashboardFixture },
    });
    const result = await posService.getCashierDashboard();
    expect(getMock).toHaveBeenCalledWith('/pos/my-dashboard');
    expect(result).toEqual(cashierDashboardFixture);
  });

  it('getAdminDashboard hits /pos/admin-dashboard and unwraps data', async () => {
    getMock.mockResolvedValueOnce({
      data: { success: true, data: adminDashboardFixture },
    });
    const result = await posService.getAdminDashboard();
    expect(getMock).toHaveBeenCalledWith('/pos/admin-dashboard');
    expect(result).toEqual(adminDashboardFixture);
  });

  it('getMyTransactions hits /pos/my-transactions and unwraps data', async () => {
    getMock.mockResolvedValueOnce({
      data: { success: true, data: transactionsSummaryFixture },
    });
    const result = await posService.getMyTransactions();
    expect(getMock).toHaveBeenCalledWith('/pos/my-transactions');
    expect(result).toEqual(transactionsSummaryFixture);
  });

  it('getAllTransactions hits /pos/all-transactions and unwraps data', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: { ...transactionsSummaryFixture, scope: 'system' },
      },
    });
    const result = await posService.getAllTransactions();
    expect(getMock).toHaveBeenCalledWith('/pos/all-transactions');
    expect(result.scope).toBe('system');
    expect(result.recentTransactions).toHaveLength(1);
  });
});
