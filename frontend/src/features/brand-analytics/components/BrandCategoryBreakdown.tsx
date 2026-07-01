import BarChart from '@/components/charts/BarChart'
import DonutChart from '@/components/charts/DonutChart'
import { CHART_COLORS } from '@/components/charts/chart-palette'
import { formatCurrency } from '@/lib/utils'
import type { IBrandCategoryRow } from '@/types'

const sliceColor = (i: number) => CHART_COLORS[i % CHART_COLORS.length]

interface BrandCategoryBreakdownProps {
  categories: IBrandCategoryRow[]
}

/** A brand's sales split across the categories its products belong to. */
export function BrandCategoryBreakdown({
  categories,
}: BrandCategoryBreakdownProps) {
  if (categories.length === 0) return null

  const barData = categories.map((c) => ({
    name: c.categoryName,
    value: c.revenue,
  }))
  const donutData = categories.map((c, i) => ({
    name: c.categoryName,
    value: c.revenue,
    color: c.color ?? sliceColor(i),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="border border-border rounded-xl p-4 bg-surface">
        <h3 className="text-sm font-semibold text-text-1 mb-3">
          Revenue by category
        </h3>
        <BarChart
          data={barData}
          height={260}
          formatValue={(v) => formatCurrency(v)}
        />
      </div>
      <div className="border border-border rounded-xl p-4 bg-surface">
        <h3 className="text-sm font-semibold text-text-1 mb-3">
          Category share
        </h3>
        <DonutChart
          data={donutData}
          size={220}
          thickness={28}
          formatValue={(v) => formatCurrency(v)}
        />
      </div>
    </div>
  )
}
