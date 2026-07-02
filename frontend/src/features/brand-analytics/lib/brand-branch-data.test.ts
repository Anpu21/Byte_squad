import { describe, expect, it } from 'vitest'
import type { IBrandBranchRow, IBrandBranchTrendResponse } from '@/types'
import { buildBrandMixByBranch, buildTrendChart } from './brand-branch-charts'
import {
  brandKeyOf,
  buildBrandColors,
  buildBrandMatrixRows,
  metricOf,
  totalOf,
} from './brand-branch-data'

const BRANCHES = [
  { branchId: 'br-1', branchName: 'Colombo' },
  { branchId: 'br-2', branchName: 'Kandy' },
]

function row(over: Partial<IBrandBranchRow> = {}): IBrandBranchRow {
  return {
    brandId: 'b1',
    brandName: 'Prima',
    color: '#e11d48',
    units: 14,
    revenue: 1400,
    profit: 280,
    transactions: 5,
    marginPct: 20,
    sharePct: 70,
    perBranch: [
      { branchId: 'br-1', revenue: 1000, units: 10, profit: 200 },
      { branchId: 'br-2', revenue: 400, units: 4, profit: 80 },
    ],
    ...over,
  }
}

describe('metricOf / totalOf', () => {
  it('switches on the active metric', () => {
    const cell = { branchId: 'br-1', revenue: 100, units: 5, profit: 20 }
    expect(metricOf(cell, 'revenue')).toBe(100)
    expect(metricOf(cell, 'units')).toBe(5)
    expect(metricOf(cell, 'profit')).toBe(20)
    expect(totalOf(row(), 'units')).toBe(14)
    expect(totalOf(row(), 'profit')).toBe(280)
  })
})

describe('buildBrandColors', () => {
  it('prefers the brand colour, falls back to the palette, keys Unbranded', () => {
    const colors = buildBrandColors([
      row(),
      row({ brandId: null, brandName: 'Unbranded', color: null }),
    ])
    expect(colors['b1']).toBe('#e11d48')
    expect(colors['unbranded']).toBeTruthy()
    expect(brandKeyOf(null)).toBe('unbranded')
  })

  it('never assigns the same hue twice — duplicate holders get a free fallback', () => {
    const colors = buildBrandColors([
      row(),
      // Same stored colour, different case — must not repeat in the ring.
      row({ brandId: 'b2', brandName: 'Clone', color: '#E11D48' }),
      row({ brandId: null, brandName: 'Unbranded', color: null }),
    ])
    expect(colors['b1']).toBe('#e11d48')
    expect(colors['b2']).not.toBe('#e11d48')
    const all = Object.values(colors)
    expect(new Set(all).size).toBe(all.length)
  })

  it('fallbacks skip pool colours already claimed by real brands', () => {
    const colors = buildBrandColors([
      row({ color: '#6366f1' }), // owns the pool's first hue
      row({ brandId: null, brandName: 'Unbranded', color: null }),
    ])
    expect(colors['unbranded']).toBe('#06b6d4') // next free pool entry
  })
})

describe('buildBrandMatrixRows', () => {
  it('flags the leader, computes the lead gap, and zero-fills missing cells', () => {
    const [matrix] = buildBrandMatrixRows(
      [row({ perBranch: [{ branchId: 'br-1', revenue: 1000, units: 10, profit: 200 }] })],
      BRANCHES,
      'revenue',
    )
    expect(matrix.leaderBranchId).toBe('br-1')
    expect(matrix.perBranch).toEqual([
      { branchId: 'br-1', value: 1000, isLeader: true },
      { branchId: 'br-2', value: 0, isLeader: false },
    ])
    expect(matrix.leadGap).toBe(1)
  })

  it('has no leader when a brand sold nowhere', () => {
    const [matrix] = buildBrandMatrixRows(
      [row({ perBranch: [] })],
      BRANCHES,
      'revenue',
    )
    expect(matrix.leaderBranchId).toBeNull()
    expect(matrix.leadGap).toBe(0)
  })
})

describe('buildBrandMixByBranch', () => {
  it('drops zero-value brands and rolls the tail into "Other"', () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      row({
        brandId: `b${i}`,
        brandName: `Brand ${i}`,
        perBranch: [
          { branchId: 'br-1', revenue: 100 - i, units: 1, profit: 1 },
          { branchId: 'br-2', revenue: 0, units: 0, profit: 0 },
        ],
      }),
    )
    const slices = buildBrandMixByBranch(
      rows,
      BRANCHES[0],
      'revenue',
      () => '#123',
    )
    expect(slices).toHaveLength(9) // 8 named + Other(2)
    expect(slices[8].name).toBe('Other (2)')
    expect(slices[8].value).toBe(100 - 8 + (100 - 9))

    // Kandy sold nothing — every slice filtered out.
    expect(
      buildBrandMixByBranch(rows, BRANCHES[1], 'revenue', () => '#123'),
    ).toHaveLength(0)
  })
})

describe('buildTrendChart', () => {
  it('keys rows by day and series by branch name, in date order', () => {
    const trend: IBrandBranchTrendResponse = {
      brand: { id: 'b1', name: 'Prima', color: null },
      branches: BRANCHES,
      startDate: '',
      endDate: '',
      series: [
        {
          branchId: 'br-1',
          points: [
            { date: '2026-06-01', revenue: 10, units: 1 },
            { date: '2026-06-02', revenue: 20, units: 2 },
          ],
        },
        {
          branchId: 'br-2',
          points: [
            { date: '2026-06-01', revenue: 0, units: 0 },
            { date: '2026-06-02', revenue: 5, units: 1 },
          ],
        },
      ],
    }
    const chart = buildTrendChart(trend, (id) => (id === 'br-1' ? '#a' : '#b'))
    expect(chart.data).toEqual([
      { name: '06-01', Colombo: 10, Kandy: 0 },
      { name: '06-02', Colombo: 20, Kandy: 5 },
    ])
    expect(chart.series).toEqual([
      { key: 'Colombo', name: 'Colombo', color: '#a' },
      { key: 'Kandy', name: 'Kandy', color: '#b' },
    ])
  })
})
