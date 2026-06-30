import BarChart from '@/components/charts/BarChart'
import AreaChart from '@/components/charts/AreaChart'
import {
  Button,
  DataTable,
  EmptyState,
  KpiCard,
  type DataTableColumn,
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  LuArrowLeft as ArrowLeft,
  LuCoins as Coins,
  LuPackage as Package,
  LuPercent as Percent,
  LuTrendingUp as TrendingUp,
} from 'react-icons/lu'
import { useBrandDrilldown } from '../hooks/useBrandDrilldown'
import type { IBrandAnalyticsParams, IBrandProductRow } from '@/types'

interface BrandDrilldownProps {
  brandId: string
  params: IBrandAnalyticsParams
  onBack: () => void
}

export function BrandDrilldown({ brandId, params, onBack }: BrandDrilldownProps) {
  const { data, isLoading } = useBrandDrilldown(brandId, params)
  const products = data?.products ?? []
  const barData = products
    .slice(0, 12)
    .map((p) => ({ name: p.productName, value: p.revenue }))
  const trendData = (data?.trend ?? []).map((t) => ({
    name: t.date.slice(5),
    value: t.revenue,
  }))

  const columns: DataTableColumn<IBrandProductRow>[] = [
    {
      key: 'product',
      header: 'Product',
      className: 'font-medium text-text-1',
      render: (r) => r.productName,
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
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Brands
        </Button>
        <div>
          <h2 className="text-lg font-bold text-text-1">
            {data?.brand.name ?? 'Brand'}
          </h2>
          <p className="text-xs text-text-3">
            {data?.totalTransactions ?? 0} orders in range
          </p>
        </div>
      </div>

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
            Top products by revenue
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
          <h3 className="text-sm font-semibold text-text-1 mb-3">
            Revenue trend
          </h3>
          {isLoading ? (
            <p className="text-sm text-text-3 py-8 text-center">Loading…</p>
          ) : trendData.length === 0 ? (
            <p className="text-sm text-text-3 py-8 text-center">
              No sales in this range.
            </p>
          ) : (
            <AreaChart
              data={trendData}
              height={260}
              formatValue={(v) => formatCurrency(v)}
            />
          )}
        </div>
      </div>

      <DataTable<IBrandProductRow>
        columns={columns}
        rows={products}
        getRowKey={(r) => r.productId}
        isLoading={isLoading}
        zebra
        empty={
          <EmptyState
            title="No product sales in this range"
            description="This brand had no sales in the selected window."
          />
        }
      />
    </div>
  )
}
