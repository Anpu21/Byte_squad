export interface IJournalLineDraft {
    key: number;
    accountId: string;
    entryType: 'debit' | 'credit';
    amount: string;
    description: string;
}

let journalLineKey = 0;

/** Monotonic key for a fresh journal line (stable across re-renders). */
export function newJournalLineKey(): number {
    return ++journalLineKey;
}

export const emptyLine = (
    entryType: 'debit' | 'credit',
): IJournalLineDraft => ({
    key: newJournalLineKey(),
    accountId: '',
    entryType,
    amount: '',
    description: '',
});

export interface ParsedJournalLine extends IJournalLineDraft {
    amountNum: number;
}

export interface JournalTotals {
    parsed: ParsedJournalLine[];
    complete: ParsedJournalLine[];
    debits: number;
    credits: number;
    balanced: boolean;
}

/** Parse line amounts and roll up Σ debits / Σ credits with a balance check. */
export function deriveJournalTotals(lines: IJournalLineDraft[]): JournalTotals {
    const parsed = lines.map((l) => ({ ...l, amountNum: Number(l.amount) }));
    const complete = parsed.filter(
        (l) => l.accountId && Number.isFinite(l.amountNum) && l.amountNum > 0,
    );
    const debits = complete
        .filter((l) => l.entryType === 'debit')
        .reduce((s, l) => s + l.amountNum, 0);
    const credits = complete
        .filter((l) => l.entryType === 'credit')
        .reduce((s, l) => s + l.amountNum, 0);
    const balanced =
        Math.round(debits * 100) === Math.round(credits * 100) && debits > 0;
    return { parsed, complete, debits, credits, balanced };
}
