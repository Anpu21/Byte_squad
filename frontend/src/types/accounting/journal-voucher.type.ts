/** One line of a manual journal (posts as a real ledger entry). */
export interface IJournalLinePayload {
    accountId: string;
    entryType: 'debit' | 'credit';
    amount: number;
    description?: string;
}

/** Request body for `POST /accounting/journals`. */
export interface IJournalVoucherPayload {
    /** Required for admins (the poster picks the branch). */
    branchId?: string;
    /** ISO date `YYYY-MM-DD`; defaults to today. */
    entryDate?: string;
    memo: string;
    /** Σ debits must equal Σ credits. */
    lines: IJournalLinePayload[];
}

/** Journal voucher header returned by the API. */
export interface IJournalVoucher {
    id: string;
    voucherNumber: string;
    branchId: string;
    entryDate: string;
    memo: string;
    total: number;
    createdByUserId: string;
    createdAt: string;
}
