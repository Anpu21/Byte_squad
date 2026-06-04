export const BRANCH_ANALYTICS_SECTIONS = [
  'financial',
  'sales',
  'inventory',
  'loyalty',
  'customers',
  'payments',
  'staff',
] as const

export type BranchAnalyticsSection =
  (typeof BRANCH_ANALYTICS_SECTIONS)[number]
