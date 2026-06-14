import { useMemo } from 'react'
import BarChart from '@/components/charts/BarChart'
import { formatCurrency } from '@/lib/utils'
import { useCategoryAnalyticsQuery } from '@/features/categories/hooks/useCategoryAnalyticsQuery'

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/**
 * Read-only "sales by category" card for the cashier dashboard. No branch
 * filter and no export — the API forces the cashier's own branch.
 */
export function MyCategorySalesCard() {
  const params = useMemo(
    () => ({
      startDate: new Date(daysAgoIso(30)).toISOString(),
      endDate: new Date().toISOString(),
    }),
    [],
  )
  const { data, isLoading } = useCategoryAnalyticsQuery(params)
  const rows = data?.rows ?? []
  const chartData = rows
    .slice(0, 8)
    .map((r) => ({ name: r.categoryName, value: r.revenue }))

  return (
    <div className="border border-border rounded-xl p-4 bg-surface">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-1">My category sales</h3>
        <span className="text-[11px] text-text-3">
          Last 30 days · your branch
        </span>
      </div>
      {isLoading ? (
        <p className="text-sm text-text-3 py-8 text-center">Loading…</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-text-3 py-8 text-center">
          No category sales yet.
        </p>
      ) : (
        <BarChart
          data={chartData}
          height={220}
          formatValue={(v) => formatCurrency(v)}
        />
      )}
    </div>
  )
}
