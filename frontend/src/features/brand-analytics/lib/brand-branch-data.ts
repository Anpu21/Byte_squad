import { CHART_COLORS } from '@/components/charts/chart-palette'
import type {
  BrandBranchMetric,
  IBrandBranchCell,
  IBrandBranchOption,
  IBrandBranchProductRow,
  IBrandBranchRow,
} from '@/types'

/** Brand rows and product rows both satisfy this for totals/cells. */
export interface ComparisonRowLike {
  revenue: number
  units: number
  profit: number
  perBranch: IBrandBranchCell[]
}

export function metricOf(
  cell: IBrandBranchCell,
  metric: BrandBranchMetric,
): number {
  if (metric === 'units') return cell.units
  if (metric === 'profit') return cell.profit
  return cell.revenue
}

export function totalOf(
  row: ComparisonRowLike,
  metric: BrandBranchMetric,
): number {
  if (metric === 'units') return row.units
  if (metric === 'profit') return row.profit
  return row.revenue
}

/** Stable row key — the Unbranded bucket has no id of its own. */
export const brandKeyOf = (brandId: string | null): string =>
  brandId ?? 'unbranded'

// Brand → colour: the brand's own colour when set, else a stable palette pick
// by leaderboard position. The SAME brand keeps one colour across the share
// ring, every branch's mix donut, and the matrix dots.
export function buildBrandColors(
  rows: IBrandBranchRow[],
): Record<string, string> {
  const map: Record<string, string> = {}
  rows.forEach((row, idx) => {
    map[brandKeyOf(row.brandId)] =
      row.color ?? CHART_COLORS[idx % CHART_COLORS.length]
  })
  return map
}

export interface BrandBranchMatrixCell {
  branchId: string
  value: number
  isLeader: boolean
}

interface RankedCells {
  perBranch: BrandBranchMatrixCell[]
  leaderBranchId: string | null
  /** Leader's margin over the runner-up as a fraction of the leader (0..1). */
  leadGap: number
}

function rankCells(
  perBranch: IBrandBranchCell[],
  branches: IBrandBranchOption[],
  metric: BrandBranchMetric,
): RankedCells {
  const values = branches.map((branch) => {
    const cell = perBranch.find((c) => c.branchId === branch.branchId)
    return {
      branchId: branch.branchId,
      value: cell ? metricOf(cell, metric) : 0,
    }
  })
  const ranked = [...values].sort((a, b) => b.value - a.value)
  const leader = ranked[0]
  const runnerUp = ranked[1]
  const leaderBranchId = leader && leader.value > 0 ? leader.branchId : null
  const leadGap =
    leader && leader.value > 0 && runnerUp
      ? (leader.value - runnerUp.value) / leader.value
      : 0
  return {
    perBranch: values.map((v) => ({
      ...v,
      isLeader: v.branchId === leaderBranchId,
    })),
    leaderBranchId,
    leadGap,
  }
}

/** Brand × branch matrix row — leader branch flagged, lead gap vs 2nd. */
export interface BrandBranchMatrixRow extends RankedCells {
  key: string
  brandId: string | null
  brandName: string
  color: string | null
  total: number
  sharePct: number
  marginPct: number
}

export function buildBrandMatrixRows(
  rows: IBrandBranchRow[],
  branches: IBrandBranchOption[],
  metric: BrandBranchMetric,
): BrandBranchMatrixRow[] {
  return rows.map((row) => ({
    key: brandKeyOf(row.brandId),
    brandId: row.brandId,
    brandName: row.brandName,
    color: row.color,
    total: totalOf(row, metric),
    sharePct: row.sharePct,
    marginPct: row.marginPct,
    ...rankCells(row.perBranch, branches, metric),
  }))
}

/** Same ranking for the drilldown's product rows. */
export interface BrandProductMatrixRow extends RankedCells {
  productId: string
  productName: string
  total: number
}

export function buildProductMatrixRows(
  items: IBrandBranchProductRow[],
  branches: IBrandBranchOption[],
  metric: BrandBranchMetric,
): BrandProductMatrixRow[] {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    total: totalOf(item, metric),
    ...rankCells(item.perBranch, branches, metric),
  }))
}
