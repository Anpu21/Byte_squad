import type { DonutSlice } from '@/components/charts/DonutChart'
import type { ChartRow } from '@/components/charts/ChartTooltip'
import type { MultiLineSeries } from '@/components/charts/MultiLineChart'
import type {
  BrandBranchMetric,
  IBrandBranchOption,
  IBrandBranchRow,
  IBrandBranchTrendResponse,
} from '@/types'
import { brandKeyOf, metricOf, totalOf } from './brand-branch-data'

/** Past this many brands the grouped bar chart gets unreadable. */
const MAX_BAR_GROUPS = 10
/** Past this many brands a per-branch mix donut rolls the tail into "Other". */
const MAX_MIX_SLICES = 8
/** The share donut mirrors the sibling tabs' six-slice ring. */
const MAX_SHARE_SLICES = 6

// (a) Grouped bars — one group per top brand, one bar per branch
// (branch-coloured so branches read consistently against the picker pills).
export function buildGroupedBrandBars(
  rows: IBrandBranchRow[],
  branches: IBrandBranchOption[],
  metric: BrandBranchMetric,
  branchColorFor: (branchId: string) => string,
): { data: ChartRow[]; bars: { key: string; label: string; color: string }[] } {
  const data: ChartRow[] = rows.slice(0, MAX_BAR_GROUPS).map((row) => {
    const entry: ChartRow = { name: row.brandName }
    for (const cell of row.perBranch) {
      entry[cell.branchId] = metricOf(cell, metric)
    }
    return entry
  })
  const bars = branches.map((branch) => ({
    key: branch.branchId,
    label: branch.branchName,
    color: branchColorFor(branch.branchId),
  }))
  return { data, bars }
}

// (b) Selection-wide share ring — top brands by the active metric.
export function buildBrandShareDonut(
  rows: IBrandBranchRow[],
  metric: BrandBranchMetric,
  colorFor: (key: string) => string,
): DonutSlice[] {
  return rows
    .slice(0, MAX_SHARE_SLICES)
    .map((row) => ({
      name: row.brandName,
      value: totalOf(row, metric),
      color: colorFor(brandKeyOf(row.brandId)),
    }))
    .filter((slice) => slice.value > 0)
}

// (c) Per-branch brand-mix donut — for ONE branch, each brand is a slice.
// Zero-value brands are dropped; the tail rolls into a muted "Other" slice.
export function buildBrandMixByBranch(
  rows: IBrandBranchRow[],
  branch: IBrandBranchOption,
  metric: BrandBranchMetric,
  colorFor: (key: string) => string,
): DonutSlice[] {
  const valued = rows
    .map((row) => ({
      key: brandKeyOf(row.brandId),
      name: row.brandName,
      value: (() => {
        const cell = row.perBranch.find((c) => c.branchId === branch.branchId)
        return cell ? metricOf(cell, metric) : 0
      })(),
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)

  const slices: DonutSlice[] = valued.slice(0, MAX_MIX_SLICES).map((s) => ({
    name: s.name,
    value: s.value,
    color: colorFor(s.key),
  }))

  const rest = valued.slice(MAX_MIX_SLICES)
  if (rest.length > 0) {
    slices.push({
      name: `Other (${rest.length})`,
      value: rest.reduce((sum, s) => sum + s.value, 0),
      color: 'var(--text-3)',
    })
  }
  return slices
}

// (d) Trend chart rows — one row per day, one line per branch (keyed by branch
// name so the tooltip/legend read naturally). Backend series are zero-filled
// over the same range, so every row carries every branch.
export function buildTrendChart(
  trend: IBrandBranchTrendResponse,
  branchColorFor: (branchId: string) => string,
): { data: ChartRow[]; series: MultiLineSeries[] } {
  const nameById = new Map(
    trend.branches.map((b) => [b.branchId, b.branchName]),
  )
  const byDate = new Map<string, ChartRow>()
  for (const s of trend.series) {
    const branchName = nameById.get(s.branchId) ?? s.branchId
    for (const point of s.points) {
      const row = byDate.get(point.date) ?? { name: point.date.slice(5) }
      row[branchName] = point.revenue
      byDate.set(point.date, row)
    }
  }
  const data = [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, row]) => row)
  const series: MultiLineSeries[] = trend.branches.map((b) => ({
    key: b.branchName,
    name: b.branchName,
    color: branchColorFor(b.branchId),
  }))
  return { data, series }
}
