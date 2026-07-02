// POS payment-method literal-union. The shop accepts only Cash and Card
// (card settles via PayHere), plus Credit — the buy-now-pay-later (khata)
// tender that rides a customer's store-credit account. Mobile wallet /
// cheque / bank transfer were removed as tender options.
//
// 'Exchange' is an INTERNAL-only settlement (not a customer-facing tender): the
// replacement leg of an exchange, paid for by the returned goods (plus an
// optional cash/card upcharge captured separately). It never appears in the
// customer sale DTO or the storefront.
export type PaymentMethod = 'Cash' | 'Card' | 'Credit' | 'Exchange';
