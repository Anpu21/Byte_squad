/**
 * Frontend mirror of the backend `MultiTenderCalculatorService`. Same
 * Shanel rules, same shape — keeping the math here lets the checkout UI
 * show live balance/change/credit numbers without a server round-trip.
 *
 * Rules (must match `backend/src/modules/pos/services/multi-tender-calculator.service.ts`):
 *   1. `paymentAmount = cash + cheque + bank + credit`. The cash tendered
 *      above `cashAmount` becomes change, NOT extra payment.
 *   2. Overpayment without `keepBalance=true` and without credit is illegal —
 *      callers must surface the validation error inline before they
 *      attempt to submit the sale.
 *   3. `paidAmount` is capped at the invoice total so the stored
 *      accounting value is stable; the surplus moves to `overpayKeptBalance`.
 *
 * The frontend doesn't throw NestJS exceptions; consumers either check
 * `validate()` first or handle the thrown plain `Error` from `calculate()`
 * inline (e.g., disabling the Charge button).
 */

export type TMultiTenderStatus = 'Paid' | 'Partially_Paid' | 'Unpaid';

export interface IMultiTenderResult {
    /** Sum of cash + cheque + bank + credit. Excludes cash returned as change. */
    paymentAmount: number;
    /** Change handed back to the customer. Derived from cash tender alone. */
    cashChange: number;
    paymentStatus: TMultiTenderStatus;
    /** `max(0, invoiceTotal - paymentAmount)`. */
    balanceDue: number;
    /** `min(paymentAmount, invoiceTotal)` — capped at invoice. */
    paidAmount: number;
    creditTaken: number;
    /** When `keepBalance && paymentAmount > invoiceTotal`. */
    overpayKeptBalance: number;
}

export interface IMultiTenderInputs {
    invoiceTotal: number;
    cashAmount: number;
    cashTendered: number;
    chequeAmount: number;
    bankTransferAmount: number;
    creditAmount: number;
    keepBalance: boolean;
}

export const MULTI_TENDER_OVERPAY_ERROR =
    'Overpayment requires keepBalance=true';

/**
 * Compute the Shanel multi-tender breakdown for a single sale.
 *
 * @throws {Error} with message {@link MULTI_TENDER_OVERPAY_ERROR} when
 *   `paymentAmount > invoiceTotal` AND `keepBalance` is false AND no
 *   `creditAmount` is involved. The error is a plain `Error` so the
 *   consumer can surface it inline rather than as a server response.
 */
export function calculateMultiTender(
    input: IMultiTenderInputs,
): IMultiTenderResult {
    const cash = Number(input.cashAmount ?? 0);
    const cheque = Number(input.chequeAmount ?? 0);
    const bank = Number(input.bankTransferAmount ?? 0);
    const credit = Number(input.creditAmount ?? 0);
    const tendered = Number(input.cashTendered ?? cash);
    const invoiceTotal = Number(input.invoiceTotal ?? 0);

    const paymentAmount = cash + cheque + bank + credit;

    if (paymentAmount > invoiceTotal && !input.keepBalance && credit === 0) {
        throw new Error(MULTI_TENDER_OVERPAY_ERROR);
    }

    const cashChange = Math.max(0, tendered - cash);

    let paymentStatus: TMultiTenderStatus = 'Paid';
    let balanceDue = 0;
    if (paymentAmount < invoiceTotal) {
        paymentStatus = paymentAmount > 0 ? 'Partially_Paid' : 'Unpaid';
        balanceDue = invoiceTotal - paymentAmount;
    }

    const paidAmount = Math.min(paymentAmount, invoiceTotal);
    const overpayKeptBalance =
        input.keepBalance && paymentAmount > invoiceTotal
            ? paymentAmount - invoiceTotal
            : 0;

    return {
        paymentAmount,
        cashChange,
        paymentStatus,
        balanceDue,
        paidAmount,
        creditTaken: credit,
        overpayKeptBalance,
    };
}

/**
 * Non-throwing wrapper for UI use. Returns `null` when the inputs are
 * invalid (overpay without keepBalance + no credit) so the consumer can
 * disable the Charge button without try/catch.
 *
 * Note: to decide whether the user *could* enable keep-balance, callers
 * should probe with `{ ...input, keepBalance: true }`. That probe never
 * throws because the overpay guard is bypassed when keepBalance is true,
 * so the probe answers "would enabling the toggle resolve the overpay?"
 * without the chicken-and-egg loop where the live calc is null on
 * overpay + !keepBalance + credit === 0.
 */
export function tryCalculateMultiTender(
    input: IMultiTenderInputs,
): IMultiTenderResult | null {
    try {
        return calculateMultiTender(input);
    } catch {
        return null;
    }
}
