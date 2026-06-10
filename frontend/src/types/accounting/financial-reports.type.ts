import type { AccountType } from './account.type';

export interface ITrialBalanceRow {
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    debits: number;
    credits: number;
}

export interface ITrialBalanceReport {
    rows: ITrialBalanceRow[];
    unmappedDebits: number;
    unmappedCredits: number;
    totalDebits: number;
    totalCredits: number;
    balanced: boolean;
}

export interface IBalanceSheetLine {
    accountCode: string;
    accountName: string;
    balance: number;
}

export interface IBalanceSheetReport {
    asOf: string;
    assets: IBalanceSheetLine[];
    liabilities: IBalanceSheetLine[];
    equity: IBalanceSheetLine[];
    retainedEarnings: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    balanced: boolean;
}

export interface IDayBookRow {
    id: string;
    createdAt: string;
    entryType: 'credit' | 'debit';
    amount: number;
    description: string;
    referenceNumber: string;
    accountCode: string | null;
    accountName: string | null;
}

export interface IDayBookReport {
    date: string;
    rows: IDayBookRow[];
    totalDebits: number;
    totalCredits: number;
}

/** A locked accounting month (`GET /accounting/periods`). */
export interface IFiscalPeriodLock {
    year: number;
    month: number;
    lockedByUserId: string;
    lockedAt: string;
}
