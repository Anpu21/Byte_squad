/**
 * Aggregate payment state for a Sale. Computed by the backend from the
 * paid-amount / balance-due relationship: full coverage = Paid; partial
 * coverage = Partially_Paid; nothing paid yet = Unpaid.
 */
export type TSalePaymentStatus = 'Paid' | 'Partially_Paid' | 'Unpaid';
