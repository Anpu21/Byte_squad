/** One customer line of `GET /pos/receivables` (unpaid sales by age). */
export interface IReceivableRow {
    userId: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    currentBalance: number;
    creditLimit: number | null;
    b0to30: number;
    b31to60: number;
    b61to90: number;
    b90plus: number;
    unpaidTotal: number;
}

/** A credit-ledger row on a customer statement. */
export interface ICreditTransactionRow {
    id: string;
    userId: string;
    saleId: string | null;
    transactionType: 'Credit_Taken' | 'Credit_Paid';
    amount: number;
    runningBalance: number;
    referenceNo: string;
    notes: string | null;
    createdAt: string;
}

/** Response of statement / receive-payment / set-limit endpoints. */
export interface ICreditStatement {
    userId: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    currentBalance: number;
    creditLimit: number | null;
    transactions: ICreditTransactionRow[];
}

export type CreditPaymentMethod = 'Cash' | 'Card' | 'Bank';

/** Request body for `POST /pos/receivables/:userId/payments`. */
export interface IReceiveCreditPaymentPayload {
    amount: number;
    method: CreditPaymentMethod;
    /** Required for admins; managers are pinned to their own branch. */
    branchId?: string;
    notes?: string;
}
