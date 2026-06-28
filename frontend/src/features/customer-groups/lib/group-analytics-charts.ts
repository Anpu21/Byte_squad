import type {
  IGroupMemberSpendRow,
  IGroupProductSpendRow,
  IGroupTrendPoint,
} from '@/types'
import type { DonutSlice } from '@/components/charts/DonutChart'
import { CHART_COLORS } from '@/components/charts/chart-palette'

/** Top members as coloured donut slices (brand tokens, so dark mode recolours). */
export function toMemberSlices(
  rows: IGroupMemberSpendRow[],
  max = 6,
): DonutSlice[] {
  return rows.slice(0, max).map((r, i) => ({
    name: r.name,
    value: r.spend,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))
}

/** Top products as {name,value} bars valued by spend. */
export function toProductBars(rows: IGroupProductSpendRow[], max = 12) {
  return rows
    .slice(0, max)
    .map((r) => ({ name: r.productName, value: r.revenue }))
}

/** Daily trend → {name,value} series with MM-DD labels. */
export function toTrendSeries(points: IGroupTrendPoint[]) {
  return points.map((p) => ({ name: p.date.slice(5), value: p.revenue }))
}
