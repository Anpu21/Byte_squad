import { describe, expect, it } from 'vitest'
import type { BrandBranchMatrixRow } from './brand-branch-data'
import { buildBrandBranchInsights } from './brand-branch-insights'

const BRANCHES = [
  { branchId: 'br-1', branchName: 'Colombo' },
  { branchId: 'br-2', branchName: 'Kandy' },
]

function matrixRow(over: Partial<BrandBranchMatrixRow>): BrandBranchMatrixRow {
  return {
    key: 'b1',
    brandId: 'b1',
    brandName: 'Prima',
    color: null,
    total: 1000,
    sharePct: 50,
    marginPct: 20,
    perBranch: [
      { branchId: 'br-1', value: 800, isLeader: true },
      { branchId: 'br-2', value: 200, isLeader: false },
    ],
    leaderBranchId: 'br-1',
    leadGap: 0.75,
    ...over,
  }
}

describe('buildBrandBranchInsights', () => {
  it('returns nothing without rows or branches', () => {
    expect(buildBrandBranchInsights([], BRANCHES, String)).toEqual([])
    expect(
      buildBrandBranchInsights([matrixRow({})], [], String),
    ).toEqual([])
  })

  it('surfaces widest gap, most wins, and uneven coverage', () => {
    const rows = [
      matrixRow({}),
      matrixRow({
        key: 'b2',
        brandId: 'b2',
        brandName: 'Anchor',
        perBranch: [
          { branchId: 'br-1', value: 0, isLeader: false },
          { branchId: 'br-2', value: 300, isLeader: true },
        ],
        leaderBranchId: 'br-2',
      }),
    ]
    const insights = buildBrandBranchInsights(rows, BRANCHES, (n) => `Rs ${n}`)

    const byKey = new Map(insights.map((i) => [i.key, i]))
    // Prima's 800-vs-200 spread beats Anchor's 300-vs-0.
    expect(byKey.get('gap')?.value).toBe('Prima')
    expect(byKey.get('gap')?.note).toBe('Colombo leads by Rs 600')
    // One win each — the first sorted entry wins the tile, count reads 1 of 2.
    expect(byKey.get('wins')?.note).toContain('of 2 brands')
    // Anchor sells in Kandy but not Colombo.
    expect(byKey.get('uneven')?.value).toBe('1 brand')
  })
})
