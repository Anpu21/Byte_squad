export const ACCOUNT_TYPES = [
  'Asset',
  'Liability',
  'Equity',
  'Income',
  'Expense',
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];
