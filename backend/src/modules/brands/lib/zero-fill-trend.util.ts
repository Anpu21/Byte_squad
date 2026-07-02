import type { BrandTrendPoint } from '@/modules/brands/types';

/**
 * Fill missing days in [start, end] with zero points so the trend line is
 * continuous. Days are keyed by UTC YYYY-MM-DD to match the repository's
 * TO_CHAR(created_at) buckets (timestamps are stored in UTC).
 */
export function zeroFillTrend(
  rows: BrandTrendPoint[],
  start: Date,
  end: Date,
): BrandTrendPoint[] {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const out: BrandTrendPoint[] = [];
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const last = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );
  while (cursor.getTime() <= last) {
    const key = cursor.toISOString().slice(0, 10);
    out.push(byDate.get(key) ?? { date: key, revenue: 0, units: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}
