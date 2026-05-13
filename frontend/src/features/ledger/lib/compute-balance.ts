import type { ILedgerEntry } from '@/types';

export interface LedgerEntryWithBalance extends ILedgerEntry {
    balance: number;
}

export function computeRunningBalance(
    entries: ILedgerEntry[],
): LedgerEntryWithBalance[] {
    const sorted = [...entries].sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    let bal = 0;
    const withBal = sorted.map((e) => {
        const credit = e.entryType === 'credit' ? Number(e.amount) : 0;
        const debit = e.entryType === 'debit' ? Number(e.amount) : 0;
        bal += credit - debit;
        return { ...e, balance: bal };
    });
    return withBal.reverse();
}
