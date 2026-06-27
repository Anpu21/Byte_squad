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
  /** Cash paid into the drawer mid-shift (float top-ups). */
  payIn: number;
  /** Cash paid out of the drawer mid-shift (petty cash, supplier cash). */
  payOut: number;
  /** openingFloat + cash − refunds + payIn − payOut — what the drawer should hold. */
  expectedCash: number;
}
