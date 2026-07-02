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

// Fallback hues for rows without a colour of their own (the Unbranded bucket,
// legacy brands). Mirrors the backend's `lib/brand-palette.ts` BRAND_PALETTE —
// the same pool auto-created brands draw from — so colours stay comparable by
// plain hex equality and fallbacks read like real brand colours. Deliberately
// NOT the CSS-var CHART_COLORS: `var(--accent)` resolves to the same green as
// a stored `#10b981`, which string checks can't see.
export const BRAND_FALLBACK_COLORS: readonly string[] = [
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#3b82f6', // blue
]

// Brand → colour with a uniqueness guarantee across the displayed set: two
// slices must never share a hue or the share ring reads as one arc. Brands
// keep their own colour first-come; duplicate holders and colourless rows get
// the first unclaimed fallback. The SAME brand keeps one colour across the
// share ring, every branch's mix donut, and the legends.
export function buildBrandColors(
  rows: IBrandBranchRow[],
): Record<string, string> {
  const map: Record<string, string> = {}
  const used = new Set<string>()

  for (const row of rows) {
    const own = row.color?.toLowerCase()
    if (own && !used.has(own)) {
      map[brandKeyOf(row.brandId)] = own
      used.add(own)
    }
  }

  let cursor = 0
  for (const row of rows) {
    const key = brandKeyOf(row.brandId)
    if (map[key]) continue
    const free = BRAND_FALLBACK_COLORS.find((c) => !used.has(c))
    // Pool exhausted (11+ colourless rows in one view) — wrap deterministically.
    const color =
      free ?? BRAND_FALLBACK_COLORS[cursor++ % BRAND_FALLBACK_COLORS.length]
    map[key] = color
    used.add(color)
  }
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
