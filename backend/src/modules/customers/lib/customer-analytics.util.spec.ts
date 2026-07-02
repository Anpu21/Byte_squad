import { computeCustomerAnalytics } from './customer-analytics.util';
import type { CustomerAnalyticsRow } from '@/modules/customers/types';

const NOW = new Date('2026-07-01T00:00:00.000Z');
const daysAgo = (n: number): string =>
  new Date(NOW.getTime() - n * 86_400_000).toISOString();

function row(over: Partial<CustomerAnalyticsRow>): CustomerAnalyticsRow {
  return {
    customerKey: 'k',
    displayName: 'C',
    lifetimeSpend: 0,
    ordersCount: 0,
    lastSeenAt: null,
    createdAt: daysAgo(400),
    ...over,
  };
}

describe('computeCustomerAnalytics', () => {
  it('buckets recency into active / at-risk / dormant / prospect', () => {
    const rows = [
      row({
        customerKey: 'a',
        lastSeenAt: daysAgo(10),
        ordersCount: 1,
        lifetimeSpend: 100,
      }),
      row({
        customerKey: 'b',
        lastSeenAt: daysAgo(120),
        ordersCount: 3,
        lifetimeSpend: 300,
      }),
      row({
        customerKey: 'c',
        lastSeenAt: daysAgo(300),
        ordersCount: 2,
        lifetimeSpend: 50,
      }),
      row({ customerKey: 'd', lastSeenAt: null }),
    ];
    const a = computeCustomerAnalytics(rows, NOW);
    expect(a.totalCustomers).toBe(4);
    expect(a.activeCustomers).toBe(1);
    expect(a.atRiskCustomers).toBe(1);
    expect(a.dormantCustomers).toBe(1);
    expect(a.neverPurchased).toBe(1);
  });

  it('assigns RFM segments by recency then frequency', () => {
    const rows = [
      row({
        customerKey: 'champ',
        lastSeenAt: daysAgo(5),
        ordersCount: 8,
        lifetimeSpend: 5000,
      }),
      row({
        customerKey: 'loyal',
        lastSeenAt: daysAgo(5),
        ordersCount: 3,
        lifetimeSpend: 900,
      }),
      row({
        customerKey: 'new',
        lastSeenAt: daysAgo(5),
        ordersCount: 1,
        lifetimeSpend: 100,
      }),
      row({
        customerKey: 'risk',
        lastSeenAt: daysAgo(120),
        ordersCount: 9,
        lifetimeSpend: 800,
      }),
    ];
    const a = computeCustomerAnalytics(rows, NOW);
    const byName = Object.fromEntries(
      a.segments.map((s) => [s.segment, s.count]),
    );
    expect(byName.Champion).toBe(1);
    expect(byName.Loyal).toBe(1);
    expect(byName.New).toBe(1);
    expect(byName['At risk']).toBe(1);
  });

  it('averages LTV over purchasers only and ranks the top spenders', () => {
    const rows = [
      row({
        customerKey: 'x',
        lastSeenAt: daysAgo(1),
        ordersCount: 2,
        lifetimeSpend: 1000,
      }),
      row({
        customerKey: 'y',
        lastSeenAt: daysAgo(1),
        ordersCount: 1,
        lifetimeSpend: 500,
      }),
      row({ customerKey: 'z', lastSeenAt: null, lifetimeSpend: 0 }),
    ];
    const a = computeCustomerAnalytics(rows, NOW);
    expect(a.totalLifetimeValue).toBe(1500);
    expect(a.avgLifetimeValue).toBe(750); // 1500 / 2 purchasers, not / 3
    expect(a.topCustomers.map((c) => c.customerKey)).toEqual(['x', 'y']);
  });

  it('counts new signups within the 30-day window', () => {
    const rows = [
      row({
        customerKey: 'fresh',
        createdAt: daysAgo(10),
        lastSeenAt: daysAgo(2),
        ordersCount: 1,
        lifetimeSpend: 10,
      }),
      row({
        customerKey: 'old',
        createdAt: daysAgo(200),
        lastSeenAt: daysAgo(2),
        ordersCount: 1,
        lifetimeSpend: 10,
      }),
    ];
    const a = computeCustomerAnalytics(rows, NOW);
    expect(a.newCustomers).toBe(1);
  });
});
