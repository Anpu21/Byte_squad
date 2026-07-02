import { useMemo } from 'react'
import { ChartCard } from '@/components/charts/ChartCard'
import MultiLineChart from '@/components/charts/MultiLineChart'
import { Button, Input, KpiCard, Segmented } from '@/components/ui'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { formatCurrency } from '@/lib/utils'
import {
  LuArrowLeft as ArrowLeft,
  LuCoins as Coins,
  LuPackage as Package,
  LuPercent as Percent,
  LuSearch as Search,
  LuTrendingUp as TrendingUp,
} from 'react-icons/lu'
import type { IBrandBranchTrendRequest } from '@/types'
import { useBrandBranchProducts } from '../hooks/useBrandBranchProducts'
import { useBrandBranchTrend } from '../hooks/useBrandBranchTrend'
import { buildTrendChart } from '../lib/brand-branch-charts'
import { buildProductMatrixRows } from '../lib/brand-branch-data'
import { BRAND_BRANCH_METRIC_OPTIONS } from '../lib/brand-branch-metric-options'
import { BrandBranchProductsTable } from './BrandBranchProductsTable'

interface BrandBranchDrilldownProps {
  brandId: string
  branchIds: string[]
  startDate: string
  endDate: string
  branchColorFor: (branchId: string) => string
  onBack: () => void
}

/**
 * One brand across the selected branches: KPIs, a daily revenue line per
 * branch, and the searchable, server-paginated product×branch matrix.
 */
export function BrandBranchDrilldown({
  brandId,
  branchIds,
  startDate,
  endDate,
  branchColorFor,
  onBack,
}: BrandBranchDrilldownProps) {
  const {
    data,
    isLoading,
    isRefreshing,
    searchInput,
    setSearch,
    sort,
    setSort,
    page,
    setPage,
  } = useBrandBranchProducts({ branchIds, startDate, endDate, brandId })

  const trendRequest = useMemo<IBrandBranchTrendRequest | null>(
    () =>
      branchIds.length > 0
        ? { branchIds, startDate, endDate, brandId }
        : null,
    [branchIds, startDate, endDate, brandId],
  )
  const trendQuery = useBrandBranchTrend(trendRequest)

  const branches = useMemo(() => data?.branches ?? [], [data])
  const items = useMemo(() => data?.items ?? [], [data])
  const format = (value: number) =>
    sort === 'units' ? Math.round(value).toLocaleString() : formatCurrency(value)
  const matrixRows = useMemo(
    () => buildProductMatrixRows(items, branches, sort),
    [items, branches, sort],
  )
  const trendChart = useMemo(
    () =>
      trendQuery.data ? buildTrendChart(trendQuery.data, branchColorFor) : null,
    // branchColorFor is stable per branch order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trendQuery.data],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> All brands
        </Button>
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: data?.brand.color ?? 'var(--primary)' }}
            aria-hidden="true"
          />
          <h2 className="text-lg font-bold text-text-1">
            {data?.brand.name ?? 'Brand'}
          </h2>
          <span className="text-[12px] text-text-3">across branches</span>
        </div>
        {isRefreshing && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-soft-text">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            Updating
          </span>
        )}
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

      <ChartCard
        title="Daily revenue by branch"
        description="Where and when this brand sells — one line per selected branch."
      >
        {!trendChart || trendChart.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-3">
            {trendQuery.isLoading ? 'Loading trend…' : 'No sales in this range.'}
          </p>
        ) : (
          <MultiLineChart
            data={trendChart.data}
            series={trendChart.series}
            height={240}
            formatValue={(v) => formatCurrency(v)}
          />
        )}
      </ChartCard>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={sort}
          options={BRAND_BRANCH_METRIC_OPTIONS}
          onChange={setSort}
        />
        <div className="sm:w-64">
          <Input
            aria-label="Search products"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
      </div>

      <BrandBranchProductsTable
        rows={matrixRows}
        branches={branches}
        metric={sort}
        branchColorFor={branchColorFor}
        format={format}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  )
}
