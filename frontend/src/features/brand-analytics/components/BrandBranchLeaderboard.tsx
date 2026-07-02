import { useMemo } from 'react'
import { MultiBranchBarChart } from '@/components/charts/MultiBranchBarChart'
import { ChartCard } from '@/components/charts/ChartCard'
import DonutChart from '@/components/charts/DonutChart'
import ExportMenu from '@/components/common/ExportMenu'
import { EmptyState, KpiCard, Segmented } from '@/components/ui'
import Card from '@/components/ui/Card'
import { formatCurrency, formatCurrencyWhole } from '@/lib/utils'
import type { ExportFormat } from '@/lib/exportUtils'
import {
  LuCoins as Coins,
  LuPackage as Package,
  LuPercent as Percent,
  LuTrendingUp as TrendingUp,
} from 'react-icons/lu'
import type {
  BrandBranchMetric,
  IBrandBranchComparisonResponse,
} from '@/types'
import {
  buildBrandShareDonut,
  buildGroupedBrandBars,
} from '../lib/brand-branch-charts'
import {
  BRAND_FALLBACK_COLORS,
  buildBrandColors,
  buildBrandMatrixRows,
} from '../lib/brand-branch-data'
import { buildBrandBranchInsights } from '../lib/brand-branch-insights'
import { BRAND_BRANCH_METRIC_OPTIONS } from '../lib/brand-branch-metric-options'
import { BrandBranchInsightsStrip } from './BrandBranchInsightsStrip'
import { BrandBranchMatrixTable } from './BrandBranchMatrixTable'
import { BrandBranchMixGrid } from './BrandBranchMixGrid'

interface BrandBranchLeaderboardProps {
  data: IBrandBranchComparisonResponse | undefined
  isLoading: boolean
  metric: BrandBranchMetric
  onMetricChange: (metric: BrandBranchMetric) => void
  branchColorFor: (branchId: string) => string
  onSelectBrand: (brandId: string) => void
  onExport: (format: ExportFormat) => void
  isExporting: boolean
}

/** KPIs, metric toggle + export, grouped bars, share ring, insights, mix, matrix. */
export function BrandBranchLeaderboard({
  data,
  isLoading,
  metric,
  onMetricChange,
  branchColorFor,
  onSelectBrand,
  onExport,
  isExporting,
}: BrandBranchLeaderboardProps) {
  const rows = useMemo(() => data?.rows ?? [], [data])
  const branches = useMemo(() => data?.branches ?? [], [data])

  const brandColors = useMemo(() => buildBrandColors(rows), [rows])
  const brandColorFor = (key: string) =>
    brandColors[key] ?? BRAND_FALLBACK_COLORS[0]
  const format = (value: number) =>
    metric === 'units' ? Math.round(value).toLocaleString() : formatCurrency(value)
  // Legend money drops the cents — the exact figures live in the matrix below.
  const donutFormat = (value: number) =>
    metric === 'units'
      ? Math.round(value).toLocaleString()
      : formatCurrencyWhole(value)

  const matrixRows = useMemo(
    () => buildBrandMatrixRows(rows, branches, metric),
    [rows, branches, metric],
  )
  const grouped = useMemo(
    () => buildGroupedBrandBars(rows, branches, metric, branchColorFor),
    // branchColorFor is stable per branch order — rows/branches drive changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, branches, metric],
  )
  const donutData = buildBrandShareDonut(rows, metric, brandColorFor)
  const insights = useMemo(
    () => buildBrandBranchInsights(matrixRows, branches, format),
    // format is derived from metric alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matrixRows, branches, metric],
  )

  const metricNoun =
    metric === 'units' ? 'Units sold' : metric === 'profit' ? 'Profit' : 'Revenue'

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={metric}
          options={BRAND_BRANCH_METRIC_OPTIONS}
          onChange={onMetricChange}
        />
        <ExportMenu
          disabled={rows.length === 0 || isLoading}
          isPreparing={isExporting}
          onExport={onExport}
        />
      </div>

      {rows.length === 0 && !isLoading ? (
        <Card className="p-4">
          <EmptyState
            title="No sales in the selected branches"
            description="Widen the date range or pick different branches."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <MultiBranchBarChart
                title={`${metricNoun} by branch`}
                description="Top brands, one bar per branch — the direct A-vs-B read."
                data={grouped.data}
                bars={grouped.bars}
                valueType={metric === 'units' ? 'number' : 'currency'}
              />
            </div>
            <ChartCard
              title="Brand share"
              description="Selection-wide split across the leading brands."
            >
              {/* Column layout: ring above a full-width legend — the side-by-side
                  legend can't fit name + amount + percent in this third-width card. */}
              <DonutChart
                data={donutData}
                layout="column"
                size={180}
                thickness={24}
                formatValue={donutFormat}
                emptyLabel="No sales"
              />
            </ChartCard>
          </div>

          <BrandBranchInsightsStrip insights={insights} />

          <BrandBranchMixGrid
            rows={rows}
            branches={branches}
            metric={metric}
            brandColorFor={brandColorFor}
            format={format}
          />

          <BrandBranchMatrixTable
            rows={matrixRows}
            branches={branches}
            metric={metric}
            branchColorFor={branchColorFor}
            format={format}
            onSelectBrand={onSelectBrand}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  )
}
