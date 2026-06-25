/**
 * Tender totals for a shift window, computed from Active sales/payments.
 * `electronic` is the card/mobile remainder of each payment after the
 * explicitly-bucketed tenders (cash/cheque/bank/credit) are subtracted —
 * the Payment row does not carry separate card/mobile columns.
 */
export interface ShiftLiveSummary {
  cash: number;
  cheque: number;
  bank: number;
  credit: number;
  electronic: number;
  salesCount: number;
  salesTotal: number;
  /** Refunds processed by this cashier in the window (assumed cash). */
  refundsTotal: number;
  /** openingFloat + cash − refunds — what the drawer should hold. */
  expectedCash: number;
}
