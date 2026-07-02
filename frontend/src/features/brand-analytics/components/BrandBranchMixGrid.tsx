import DonutChart from '@/components/charts/DonutChart'
import { ChartCard } from '@/components/charts/ChartCard'
import type {
  BrandBranchMetric,
  IBrandBranchOption,
  IBrandBranchRow,
} from '@/types'
import { buildBrandMixByBranch } from '../lib/brand-branch-charts'
import { brandKeyOf } from '../lib/brand-branch-data'

interface BrandBranchMixGridProps {
  rows: IBrandBranchRow[]
  branches: IBrandBranchOption[]
  metric: BrandBranchMetric
  brandColorFor: (key: string) => string
  format: (value: number) => string
}

/**
 * One donut per branch, each showing that branch's brand mix. A brand keeps
 * the SAME colour in every ring (shared legend up top), so the eye can compare
 * "how big is Prima here vs there" directly.
 */
export function BrandBranchMixGrid({
  rows,
  branches,
  metric,
  brandColorFor,
  format,
}: BrandBranchMixGridProps) {
  const noun =
    metric === 'units' ? 'units' : metric === 'profit' ? 'profit' : 'revenue'
  const legend = rows.slice(0, 8)
  const hasOther = rows.length > legend.length

  return (
    <ChartCard
      title="Brand mix per branch"
      description={`How each branch's ${noun} splits across brands — colours are shared across every ring.`}
    >
      <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1.5">
        {legend.map((row) => (
          <span
            key={brandKeyOf(row.brandId)}
            className="inline-flex items-center gap-1.5 text-[11.5px] text-text-2"
          >
            <span
              className="size-2.5 flex-none rounded-sm"
              style={{ backgroundColor: brandColorFor(brandKeyOf(row.brandId)) }}
              aria-hidden="true"
            />
            <span className="max-w-[140px] truncate">{row.brandName}</span>
          </span>
        ))}
        {hasOther && (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-text-3">
            <span
              className="size-2.5 flex-none rounded-sm"
              style={{ backgroundColor: 'var(--text-3)' }}
              aria-hidden="true"
            />
            Other
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => {
          const slices = buildBrandMixByBranch(
            rows,
            branch,
            metric,
            brandColorFor,
          )
          const total = slices.reduce((sum, s) => sum + s.value, 0)
          return (
            <div
              key={branch.branchId}
              className="flex min-w-0 flex-col items-center"
            >
              <DonutChart
                data={slices}
                formatValue={format}
                showLegend={false}
                size={140}
                centerValue={total > 0 ? format(total) : undefined}
                centerLabel={noun}
                emptyLabel="No sales"
              />
              <p className="mt-2 max-w-full truncate text-center text-[12.5px] font-semibold text-text-1">
                {branch.branchName}
              </p>
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}
