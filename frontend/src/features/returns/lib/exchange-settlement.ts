import type { IExchangePaymentInput } from '@/types'

// Mirrors the server's ExchangeService.resolveSettlement so the UI can preview
// the money movement before submitting. R = returned value, P = replacement.

const EPSILON = 0.005

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export type SettlementKind = 'even' | 'pay' | 'refund'

export interface ExchangeSettlement {
  /** P − R. */
  diff: number
  kind: SettlementKind
  /** Absolute money that moves: 0 for even, the difference otherwise. */
  amount: number
}

/** Classify the money movement from the returned vs replacement value. */
export function settleExchange(
  returnedValue: number,
  replacementValue: number,
): ExchangeSettlement {
  const diff = round2(replacementValue - returnedValue)
  if (diff > EPSILON) return { diff, kind: 'pay', amount: diff }
  if (diff < -EPSILON) return { diff, kind: 'refund', amount: round2(-diff) }
  return { diff: 0, kind: 'even', amount: 0 }
}

export type ExchangeTenderMethod = 'Cash' | 'Card'

/**
 * Build the upcharge Payment for a dearer swap (kind === 'pay'). Cash carries
 * the tendered amount so the server can compute change; Card rides
 * `paymentAmount` only (surfaces as the card residual). Returns undefined when
 * no money is owed (even/refund) — the server needs no payment then.
 */
export function buildExchangePayment(
  settlement: ExchangeSettlement,
  method: ExchangeTenderMethod,
  cashTendered: number,
): IExchangePaymentInput | undefined {
  if (settlement.kind !== 'pay') return undefined
  if (method === 'Cash') {
    return {
      paymentMethod: 'Cash',
      paymentAmount: settlement.amount,
      cashAmount: settlement.amount,
      cashTendered: round2(cashTendered),
    }
  }
  return { paymentMethod: 'Card', paymentAmount: settlement.amount }
}

/** Change owed back on a cash upcharge (0 for card/even/refund). */
export function exchangeCashChange(
  settlement: ExchangeSettlement,
  method: ExchangeTenderMethod,
  cashTendered: number,
): number {
  if (settlement.kind !== 'pay' || method !== 'Cash') return 0
  return round2(Math.max(0, cashTendered - settlement.amount))
}
