/**
 * Shanel POS payment-method literal-union. Wider than the legacy
 * `@/constants/enums#PaymentMethod` enum (which is used for customer-order
 * online checkout): the POS supports split-tender across cash, card,
 * mobile wallet, cheque, bank transfer, and store credit.
 */
export type TPaymentMethod =
  | 'Cash'
  | 'Card'
  | 'Mobile'
  | 'Cheque'
  | 'Bank'
  | 'Credit';
