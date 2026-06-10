import type { AccountType } from './account-type.type';

/** One account line of the trial balance. */
export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debits: number;
  credits: number;
}

export interface TrialBalanceReport {
  rows: TrialBalanceRow[];
  /** Entries posted before the chart existed and never backfilled. */
  unmappedDebits: number;
  unmappedCredits: number;
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
}

/** One section line of the balance sheet (signed natural balance). */
export interface BalanceSheetLine {
  accountCode: string;
  accountName: string;
  balance: number;
}

export interface BalanceSheetReport {
  asOf: string;
  assets: BalanceSheetLine[];
  liabilities: BalanceSheetLine[];
  equity: BalanceSheetLine[];
  /** Income − Expenses to date — closes the books virtually. */
  retainedEarnings: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  balanced: boolean;
}

/** One day-book line (a ledger entry with its account). */
export interface DayBookRow {
  id: string;
  createdAt: string;
  entryType: 'credit' | 'debit';
  amount: number;
  description: string;
  referenceNumber: string;
  accountCode: string | null;
  accountName: string | null;
}

export interface DayBookReport {
  date: string;
  rows: DayBookRow[];
  totalDebits: number;
  totalCredits: number;
}
