/**
 * POS payment-method literal-union. The shop accepts only **Cash** and
 * **Card** (card is settled via PayHere), plus **Credit** — the buy-now-
 * pay-later (khata) tender that rides a customer's store-credit account.
 * Mobile wallet / cheque / bank transfer were removed as tender options.
 */
export type TPaymentMethod = 'Cash' | 'Card' | 'Credit';
