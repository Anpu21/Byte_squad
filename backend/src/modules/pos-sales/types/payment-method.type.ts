// Shanel POS payment-method literal-union. Wider than the legacy
// `@common/enums/payment-method` enum (which is used for customer-order
// online checkout): the POS supports split-tender across cash, card,
// mobile wallet, cheque, bank transfer, and store credit.
export type PaymentMethod =
  | 'Cash'
  | 'Card'
  | 'Mobile'
  | 'Cheque'
  | 'Bank'
  | 'Credit';
