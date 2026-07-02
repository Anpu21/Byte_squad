import type { BrandBranchMetric } from '@/types'

// The brand×branch views rank by revenue, units, OR profit (the brand module
// tracks COGS), so this toggle has one more option than the branch-comparison
// products tab.
export const BRAND_BRANCH_METRIC_OPTIONS: {
  label: string
  value: BrandBranchMetric
}[] = [
  { label: 'Revenue', value: 'revenue' },
  { label: 'Units', value: 'units' },
  { label: 'Profit', value: 'profit' },
]
