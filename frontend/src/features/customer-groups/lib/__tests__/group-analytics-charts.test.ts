import { describe, it, expect } from 'vitest'
import {
  toMemberSlices,
  toProductBars,
  toTrendSeries,
} from '../group-analytics-charts'
import type {
  IGroupMemberSpendRow,
  IGroupProductSpendRow,
  IGroupTrendPoint,
} from '@/types'

describe('group-analytics-charts', () => {
  it('maps members to coloured donut slices, capped at the max', () => {
    const rows: IGroupMemberSpendRow[] = Array.from({ length: 8 }, (_, i) => ({
      userId: `u${i}`,
      name: `M${i}`,
      spend: 100 - i,
      orders: 1,
      sharePct: 0,
    }))
    const slices = toMemberSlices(rows, 6)
    expect(slices).toHaveLength(6)
    expect(slices[0]).toMatchObject({ name: 'M0', value: 100 })
    expect(slices[0].color).toMatch(/^var\(--/)
  })

  it('maps products to spend bars, capped at the max', () => {
    const rows: IGroupProductSpendRow[] = Array.from({ length: 15 }, (_, i) => ({
      productId: `p${i}`,
      productName: `P${i}`,
      units: 1,
      revenue: 50 + i,
      sharePct: 0,
    }))
    const bars = toProductBars(rows, 12)
    expect(bars).toHaveLength(12)
    expect(bars[0]).toEqual({ name: 'P0', value: 50 })
  })

  it('trims trend dates to MM-DD', () => {
    const pts: IGroupTrendPoint[] = [{ date: '2026-06-02', revenue: 500 }]
    expect(toTrendSeries(pts)).toEqual([{ name: '06-02', value: 500 }])
  })
})
