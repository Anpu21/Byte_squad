import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateSalePaymentDto } from '@/modules/pos-sales/dto/create-sale.dto';

/**
 * The shape returned by `MultiTenderCalculatorService.calculate`. Mirrors
 * Shanel's payment summary used by the Sale + Payment row writes:
 *
 *  - `paymentAmount`: sum of cash + cheque + bank + credit (MONEY only).
 *    Excludes the cash portion returned as change AND the loyalty tender,
 *    which is non-cash and tracked separately. This is what the Payment
 *    row's `payment_amount` column stores.
 *  - `loyaltyApplied`: the money value of redeemed loyalty points settling
 *    this invoice (a non-cash tender). Written to `payment.loyalty_amount`.
 *  - `cashChange`: change handed back to the customer; derived from cash
 *    tender alone (cheque / bank / credit / loyalty can't generate change).
 *  - `paymentStatus`: keyed off the TOTAL settled (`paymentAmount +
 *    loyaltyApplied`): 'Paid' when `settled >= invoiceTotal`,
 *    'Partially_Paid' when `0 < settled < invoiceTotal`, 'Unpaid' when 0.
 *  - `balanceDue`: `max(0, invoiceTotal - settled)`. The Sale row uses this
 *    for the AR badge on the recent-sales sidebar.
 *  - `paidAmount`: `min(settled, invoiceTotal)` — capped at the invoice so an
 *    overpayment with `keepBalance=true` doesn't inflate this number. Counts
 *    the loyalty tender so a points-settled invoice reads as fully paid.
 *  - `creditTaken`: the `creditAmount` field of the payment payload. The
 *    Sale write inserts a corresponding `Credit_Taken` row in
 *    `credit_transactions` when this is positive AND a customer is attached.
 *  - `overpayKeptBalance`: when `keepBalance=true` and the customer pays more
 *    than the invoice, the excess (always money — loyalty is capped below the
 *    bill) is kept as customer credit (a `Credit_Paid` row that decreases
 *    their running balance).
 */
export interface MultiTenderResult {
  paymentAmount: number;
  loyaltyApplied: number;
  cashChange: number;
  paymentStatus: 'Paid' | 'Partially_Paid' | 'Unpaid';
  balanceDue: number;
  paidAmount: number;
  creditTaken: number;
  overpayKeptBalance: number;
}

/**
 * MultiTenderCalculatorService — Shanel multi-tender split math.
 *
 * Pure function wrapped in a service so consumers (`PosWriteService`) can
 * inject it. The service has no dependencies; it's `@Injectable` only so the
 * Nest DI container can hand the same instance to every caller.
 */
@Injectable()
export class MultiTenderCalculatorService {
  /**
   * Compute the Shanel multi-tender breakdown for a single sale.
   *
   * Rules (mirrored from Shanel `postSalesData`):
   *  1. `paymentAmount = cash + cheque + bank + credit`. Cash tendered above
   *     `cashAmount` becomes change, NOT additional payment.
   *  2. Overpayment without `keepBalance=true` and without credit is illegal —
   *     the cashier must either reduce the tender or flip the flag.
   *  3. `paidAmount` is capped at the invoice total so the Sale row stores a
   *     stable accounting value; the overpaid surplus moves to
   *     `overpayKeptBalance`.
   *
   * Redeemed loyalty points settle the invoice like a non-cash tender:
   * `loyaltyAmount` (their money value, pre-capped by the caller) is added
   * to the settlement total so the customer only owes the money remainder,
   * but is excluded from `paymentAmount` (it has its own Payment column).
   *
   * @throws BadRequestException when overpayment is detected without
   *   `keepBalance=true` (and no credit involvement).
   */
  calculate(
    invoiceTotal: number,
    payment: CreateSalePaymentDto,
    loyaltyAmount = 0,
  ): MultiTenderResult {
    const cash = Number(payment.cashAmount ?? 0);
    const cheque = Number(payment.chequeAmount ?? 0);
    const bank = Number(payment.bankTransferAmount ?? 0);
    const credit = Number(payment.creditAmount ?? 0);
    const loyalty = Math.max(0, Number(loyaltyAmount));
    // Cashier may type the tendered cash separately (handing 1000 for a 950
    // bill). When omitted, fall back to `cashAmount` so the change calc
    // returns 0 instead of negative.
    const tendered = Number(payment.cashTendered ?? cash);

    // `paymentAmount` is money only; `settled` folds in the loyalty tender
    // and is what the invoice-satisfaction math keys off.
    const paymentAmount = cash + cheque + bank + credit;
    const settled = paymentAmount + loyalty;

    if (settled > invoiceTotal && !payment.keepBalance && credit === 0) {
      throw new BadRequestException('Overpayment requires keepBalance=true');
    }

    // Change is derived only from cash tender (Shanel rule). Cheque/bank
    // overpayment is illegal without `keepBalance`; the check above guards
    // that case. Cash overpay via tendered > cashAmount is normal change.
    const cashChange = Math.max(0, tendered - cash);

    let paymentStatus: MultiTenderResult['paymentStatus'] = 'Paid';
    let balanceDue = 0;
    if (settled < invoiceTotal) {
      paymentStatus = settled > 0 ? 'Partially_Paid' : 'Unpaid';
      balanceDue = invoiceTotal - settled;
    }

    const paidAmount = Math.min(settled, invoiceTotal);
    const overpayKeptBalance =
      payment.keepBalance && settled > invoiceTotal
        ? settled - invoiceTotal
        : 0;

    return {
      paymentAmount,
      loyaltyApplied: loyalty,
      cashChange,
      paymentStatus,
      balanceDue,
      paidAmount,
      creditTaken: credit,
      overpayKeptBalance,
    };
  }
}
