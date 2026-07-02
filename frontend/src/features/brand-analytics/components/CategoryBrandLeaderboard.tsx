import BarChart from '@/components/charts/BarChart'
import DonutChart from '@/components/charts/DonutChart'
import { CHART_COLORS } from '@/components/charts/chart-palette'
import {
  DataTable,
  EmptyState,
  KpiCard,
  type DataTableColumn,
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  LuCoins as Coins,
  LuPackage as Package,
  LuPercent as Percent,
  LuTrendingUp as TrendingUp,
} from 'react-icons/lu'
import { useCategoryComparison } from '../hooks/useCategoryComparison'
import type { IBrandAnalyticsParams, ICategoryBrandRow } from '@/types'

const sliceColor = (i: number) => CHART_COLORS[i % CHART_COLORS.length]

interface CategoryBrandLeaderboardProps {
  categoryId: string
  params: IBrandAnalyticsParams
}

/** KPIs, revenue-by-brand bar, brand-share donut, and the brand table. */
export function CategoryBrandLeaderboard({
  categoryId,
  params,
}: CategoryBrandLeaderboardProps) {
  const { data, isLoading } = useCategoryComparison(categoryId, params)
  const brands = data?.brands ?? []
  const barData = brands
    .slice(0, 12)
    .map((b) => ({ name: b.brandName, value: b.revenue }))
  const donutData = brands.slice(0, 6).map((b, i) => ({
    name: b.brandName,
    value: b.revenue,
    color: b.color ?? sliceColor(i),
  }))

  const columns: DataTableColumn<ICategoryBrandRow>[] = [
    {
      key: 'brand',
      header: 'Brand',
      className: 'font-medium text-text-1',
      render: (r, i) => (
        <span className="inline-flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: r.color ?? sliceColor(i) }}
          />
          {r.brandName}
        </span>
      ),
    },
    {
      key: 'units',
      header: 'Units',
      align: 'right',
      numeric: true,
      render: (r) => Math.round(r.units),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      numeric: true,
      render: (r) => formatCurrency(r.revenue),
    },
    {
      key: 'profit',
      header: 'Profit',
      align: 'right',
      numeric: true,
      render: (r) => formatCurrency(r.profit),
    },
    {
      key: 'margin',
      header: 'Margin',
      align: 'right',
      numeric: true,
      render: (r) => `${r.marginPct}%`,
    },
    {
      key: 'share',
      header: 'Share',
      align: 'right',
      numeric: true,
      render: (r) => `${r.sharePct}%`,
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'right',
      numeric: true,
      render: (r) => r.transactions,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Revenue"
          accent="accent"
          icon={<Coins className="w-4 h-4" />}
          value={formatCurrency(data?.totalRevenue ?? 0)}
        />
        <KpiCard
          label="Units"
          accent="primary"
          icon={<Package className="w-4 h-4" />}
          value={String(Math.round(data?.totalUnits ?? 0))}
        />
        <KpiCard
          label="Profit"
          accent="info"
          icon={<TrendingUp className="w-4 h-4" />}
          value={formatCurrency(data?.totalProfit ?? 0)}
        />
        <KpiCard
          label="Margin"
          accent="warning"
          icon={<Percent className="w-4 h-4" />}
          value={`${data?.marginPct ?? 0}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-border rounded-xl p-4 bg-surface">
          <h3 className="text-sm font-semibold text-text-1 mb-3">
            Revenue by brand
          </h3>
          {isLoading ? (
            <p className="text-sm text-text-3 py-8 text-center">Loading…</p>
          ) : barData.length === 0 ? (
            <p className="text-sm text-text-3 py-8 text-center">
              No sales in this range.
            </p>
          ) : (
            <BarChart
              data={barData}
              height={260}
              formatValue={(v) => formatCurrency(v)}
            />
          )}
        </div>
        <div className="border border-border rounded-xl p-4 bg-surface">
          <h3 className="text-sm font-semibold text-text-1 mb-3">Brand share</h3>
          {isLoading ? (
            <p className="text-sm text-text-3 py-8 text-center">Loading…</p>
          ) : donutData.length === 0 ? (
            <p className="text-sm text-text-3 py-8 text-center">
              No sales in this range.
            </p>
          ) : (
            <DonutChart
              data={donutData}
              size={220}
              thickness={28}
              formatValue={(v) => formatCurrency(v)}
            />
          )}
        </div>
      </div>

      <DataTable<ICategoryBrandRow>
        columns={columns}
        rows={brands}
        getRowKey={(r) => r.brandId ?? 'unbranded'}
        isLoading={isLoading}
        zebra
        empty={
          <EmptyState
            title="No brand sales in this category"
            description="No products in this category sold in the selected window."
          />
        }
      />
    </div>
  )
}
