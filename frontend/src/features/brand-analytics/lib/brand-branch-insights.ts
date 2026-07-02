import type { IBrandBranchOption } from '@/types'
import type { BrandBranchMatrixRow } from './brand-branch-data'

export type BrandBranchInsightAccent = 'primary' | 'accent' | 'info' | 'warning'

export interface BrandBranchInsight {
  key: string
  label: string
  value: string
  note: string
  accent: BrandBranchInsightAccent
}

/**
 * "Key points & differences" for the brand×branch matrix, computed off the
 * already-shaped rows for the active metric. The comparison is unpaginated, so
 * these are selection-wide claims (unlike the page-scoped products strip).
 */
export function buildBrandBranchInsights(
  rows: BrandBranchMatrixRow[],
  branches: IBrandBranchOption[],
  format: (n: number) => string,
): BrandBranchInsight[] {
  if (rows.length === 0 || branches.length === 0) return []
  const nameById = new Map(branches.map((b) => [b.branchId, b.branchName]))

  // 1 — the brand with the widest leader-vs-lowest gap across branches.
  let widest: { name: string; gap: number; leader: string } | null = null
  for (const row of rows) {
    const vals = row.perBranch.map((c) => c.value)
    const gap = Math.max(...vals) - Math.min(...vals)
    if (!widest || gap > widest.gap) {
      widest = {
        name: row.brandName,
        gap,
        leader: nameById.get(row.leaderBranchId ?? '') ?? '—',
      }
    }
  }

  // 2 — which branch leads the most brands.
  const wins = new Map<string, number>()
  for (const row of rows) {
    if (row.leaderBranchId) {
      wins.set(row.leaderBranchId, (wins.get(row.leaderBranchId) ?? 0) + 1)
    }
  }
  const topWinner = [...wins.entries()].sort((a, b) => b[1] - a[1])[0]

  // 3 — brands selling in some branches but absent (a real 0) in others.
  const uneven = rows.filter(
    (row) =>
      row.perBranch.some((c) => c.value === 0) &&
      row.perBranch.some((c) => c.value > 0),
  )

  const insights: BrandBranchInsight[] = []
  if (widest) {
    insights.push({
      key: 'gap',
      label: 'Widest branch gap',
      value: widest.name,
      note: `${widest.leader} leads by ${format(widest.gap)}`,
      accent: 'warning',
    })
  }
  if (topWinner) {
    insights.push({
      key: 'wins',
      label: 'Most brand wins',
      value: nameById.get(topWinner[0]) ?? '—',
      note: `Leads ${topWinner[1]} of ${rows.length} brands`,
      accent: 'accent',
    })
  }
  insights.push({
    key: 'uneven',
    label: 'Uneven coverage',
    value: `${uneven.length} ${uneven.length === 1 ? 'brand' : 'brands'}`,
    note:
      uneven.length > 0
        ? 'Selling in some branches, absent in others'
        : 'Every brand sells in every selected branch',
    accent: uneven.length > 0 ? 'info' : 'primary',
  })
  return insights
}
