export const BRANCH_ANALYTICS_SECTIONS = [
  'financial',
  'sales',
  'inventory',
  'loyalty',
  'customers',
  'payments',
  'staff',
] as const

/**
 * Every section the comparison endpoint accepts. `'trend'` (the daily
 * revenue-by-branch series) is a valid request value but NOT part of the
 * default {@link BRANCH_ANALYTICS_SECTIONS} — only the Summary view requests it,
 * so the table sub-tabs never trigger the extra daily aggregation.
 */
export const BRANCH_ANALYTICS_SECTION_VALUES = [
  ...BRANCH_ANALYTICS_SECTIONS,
  'trend',
] as const

export type BranchAnalyticsSection =
  (typeof BRANCH_ANALYTICS_SECTION_VALUES)[number]
