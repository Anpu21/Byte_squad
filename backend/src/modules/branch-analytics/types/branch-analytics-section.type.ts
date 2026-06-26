export const BRANCH_ANALYTICS_SECTIONS = [
  'financial',
  'sales',
  'inventory',
  'loyalty',
  'customers',
  'payments',
  'staff',
] as const;

/**
 * Every section the comparison endpoint accepts. `'trend'` (the daily
 * revenue-by-branch series) is a valid request value but intentionally NOT part
 * of {@link BRANCH_ANALYTICS_SECTIONS} — the default set — so callers that omit
 * `sections` (and the table-only sub-tabs) never pay for the extra daily
 * GROUP BY. Only the Summary view requests it.
 */
export const BRANCH_ANALYTICS_SECTION_VALUES = [
  ...BRANCH_ANALYTICS_SECTIONS,
  'trend',
] as const;

export type BranchAnalyticsSection =
  (typeof BRANCH_ANALYTICS_SECTION_VALUES)[number];
