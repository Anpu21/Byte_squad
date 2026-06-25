import type { AccountType } from './account-type.type';

/**
 * System chart of accounts. Codes are stable identifiers (referenced by
 * the posting paths and the backfill migration); names are display-only.
 */
export const ACCOUNT_CODES = {
  CASH: '1000',
  BANK: '1100',
  ACCOUNTS_RECEIVABLE: '1200',
  INVENTORY: '1300',
  ACCOUNTS_PAYABLE: '2000',
  OWNERS_EQUITY: '3000',
  SALES_REVENUE: '4000',
  OTHER_INCOME: '4900',
  COST_OF_GOODS_SOLD: '5000',
  OPERATING_EXPENSES: '6000',
} as const;

export type AccountCode = (typeof ACCOUNT_CODES)[keyof typeof ACCOUNT_CODES];

export interface SystemAccountSeed {
  code: AccountCode;
  name: string;
  type: AccountType;
}

export const SYSTEM_ACCOUNTS: SystemAccountSeed[] = [
  { code: ACCOUNT_CODES.CASH, name: 'Cash', type: 'Asset' },
  { code: ACCOUNT_CODES.BANK, name: 'Bank', type: 'Asset' },
  {
    code: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    name: 'Accounts Receivable',
    type: 'Asset',
  },
  { code: ACCOUNT_CODES.INVENTORY, name: 'Inventory', type: 'Asset' },
  {
    code: ACCOUNT_CODES.ACCOUNTS_PAYABLE,
    name: 'Accounts Payable',
    type: 'Liability',
  },
  { code: ACCOUNT_CODES.OWNERS_EQUITY, name: "Owner's Equity", type: 'Equity' },
  { code: ACCOUNT_CODES.SALES_REVENUE, name: 'Sales Revenue', type: 'Income' },
  { code: ACCOUNT_CODES.OTHER_INCOME, name: 'Other Income', type: 'Income' },
  {
    code: ACCOUNT_CODES.COST_OF_GOODS_SOLD,
    name: 'Cost of Goods Sold',
    type: 'Expense',
  },
  {
    code: ACCOUNT_CODES.OPERATING_EXPENSES,
    name: 'Operating Expenses',
    type: 'Expense',
  },
];
