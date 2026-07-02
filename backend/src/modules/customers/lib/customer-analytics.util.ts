import type {
  CustomerAnalytics,
  CustomerAnalyticsRow,
} from '@/modules/customers/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NEW_WINDOW_DAYS = 30;
const ACTIVE_DAYS = 90;
const AT_RISK_DAYS = 180;

// RFM-lite display order; buckets with no members are dropped.
const SEGMENT_ORDER = [
  'Champion',
  'Loyal',
  'New',
  'At risk',
  'Dormant',
  'Prospect',
] as const;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function daysSince(iso: string, nowMs: number): number {
  return (nowMs - new Date(iso).getTime()) / DAY_MS;
}

// Recency drives the bucket first; frequency (orders) splits the recent set.
function segmentOf(row: CustomerAnalyticsRow, nowMs: number): string {
  if (!row.lastSeenAt) return 'Prospect';
  const days = daysSince(row.lastSeenAt, nowMs);
  if (days > AT_RISK_DAYS) return 'Dormant';
  if (days > ACTIVE_DAYS) return 'At risk';
  if (row.ordersCount >= 5) return 'Champion';
  if (row.ordersCount >= 2) return 'Loyal';
  return 'New';
}

/**
 * Pure RFM-lite rollup over every in-scope customer: recency buckets
 * (active / at-risk / dormant), RFM segments, LTV totals, and the top-10
 * lifetime spenders. DB-free so it can be unit-tested with a fixed `now`.
 */
export function computeCustomerAnalytics(
  rows: CustomerAnalyticsRow[],
  now: Date,
): CustomerAnalytics {
  const nowMs = now.getTime();
  let activeCustomers = 0;
  let atRiskCustomers = 0;
  let dormantCustomers = 0;
  let newCustomers = 0;
  let neverPurchased = 0;
  let totalLifetimeValue = 0;
  let purchasers = 0;
  const buckets = new Map<string, { count: number; revenue: number }>();

  for (const row of rows) {
    totalLifetimeValue += row.lifetimeSpend;
    if (row.lifetimeSpend > 0) purchasers += 1;
    if (daysSince(row.createdAt, nowMs) <= NEW_WINDOW_DAYS) newCustomers += 1;
    if (!row.lastSeenAt) {
      neverPurchased += 1;
    } else {
      const days = daysSince(row.lastSeenAt, nowMs);
      if (days <= ACTIVE_DAYS) activeCustomers += 1;
      else if (days <= AT_RISK_DAYS) atRiskCustomers += 1;
      else dormantCustomers += 1;
    }
    const seg = segmentOf(row, nowMs);
    const bucket = buckets.get(seg) ?? { count: 0, revenue: 0 };
    bucket.count += 1;
    bucket.revenue += row.lifetimeSpend;
    buckets.set(seg, bucket);
  }

  const segments = SEGMENT_ORDER.map((segment) => ({
    segment,
    count: buckets.get(segment)?.count ?? 0,
    revenue: round2(buckets.get(segment)?.revenue ?? 0),
  })).filter((s) => s.count > 0);

  const topCustomers = [...rows]
    .filter((r) => r.lifetimeSpend > 0)
    .sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
    .slice(0, 10)
    .map((r) => ({
      customerKey: r.customerKey,
      displayName: r.displayName,
      lifetimeSpend: round2(r.lifetimeSpend),
      ordersCount: r.ordersCount,
      lastSeenAt: r.lastSeenAt,
    }));

  return {
    totalCustomers: rows.length,
    activeCustomers,
    atRiskCustomers,
    dormantCustomers,
    newCustomers,
    neverPurchased,
    totalLifetimeValue: round2(totalLifetimeValue),
    avgLifetimeValue:
      purchasers > 0 ? round2(totalLifetimeValue / purchasers) : 0,
    segments,
    topCustomers,
  };
}
