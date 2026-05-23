import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateSalePaymentDto } from '@pos/dto/create-sale.dto';

/**
 * The shape returned by `MultiTenderCalculatorService.calculate`. Mirrors
 * Shanel's payment summary used by the Sale + Payment row writes:
 *
 *  - `paymentAmount`: sum of cash + cheque + bank + credit. Excludes the cash
 *    portion that's returned as change (cashTendered minus cashAmount).
 *  - `cashChange`: change handed back to the customer; derived from cash
 *    tender alone (cheque / bank / credit can't generate change).
 *  - `paymentStatus`: 'Paid' when `paymentAmount >= invoiceTotal`,
 *    'Partially_Paid' when `0 < paymentAmount < invoiceTotal`,
 *    'Unpaid' when `paymentAmount === 0`.
 *  - `balanceDue`: `max(0, invoiceTotal - paymentAmount)`. The Sale row uses
 *    this for the AR badge on the recent-sales sidebar.
 *  - `paidAmount`: `min(paymentAmount, invoiceTotal)` — capped at the invoice
 *    so an overpayment with `keepBalance=true` doesn't inflate this number.
 *  - `creditTaken`: the `creditAmount` field of the payment payload. The
 *    Sale write inserts a corresponding `Credit_Taken` row in
 *    `credit_transactions` when this is positive AND a customer is attached.
 *  - `overpayKeptBalance`: when `keepBalance=true` and the customer pays more
 *    than the invoice, the excess is kept as customer credit (a `Credit_Paid`
 *    row that decreases their running balance).
 */
export interface MultiTenderResult {
  paymentAmount: number;
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
   * @throws BadRequestException when overpayment is detected without
   *   `keepBalance=true` (and no credit involvement).
   */
  calculate(
    invoiceTotal: number,
    payment: CreateSalePaymentDto,
  ): MultiTenderResult {
    const cash = Number(payment.cashAmount ?? 0);
    const cheque = Number(payment.chequeAmount ?? 0);
    const bank = Number(payment.bankTransferAmount ?? 0);
    const credit = Number(payment.creditAmount ?? 0);
    // Cashier may type the tendered cash separately (handing 1000 for a 950
    // bill). When omitted, fall back to `cashAmount` so the change calc
    // returns 0 instead of negative.
    const tendered = Number(payment.cashTendered ?? cash);

    const paymentAmount = cash + cheque + bank + credit;

    if (paymentAmount > invoiceTotal && !payment.keepBalance && credit === 0) {
      throw new BadRequestException(
        'Overpayment requires keepBalance=true',
      );
    }

    // Change is derived only from cash tender (Shanel rule). Cheque/bank
    // overpayment is illegal without `keepBalance`; the check above guards
    // that case. Cash overpay via tendered > cashAmount is normal change.
    const cashChange = Math.max(0, tendered - cash);

    let paymentStatus: MultiTenderResult['paymentStatus'] = 'Paid';
    let balanceDue = 0;
    if (paymentAmount < invoiceTotal) {
      paymentStatus = paymentAmount > 0 ? 'Partially_Paid' : 'Unpaid';
      balanceDue = invoiceTotal - paymentAmount;
    }

    const paidAmount = Math.min(paymentAmount, invoiceTotal);
    const overpayKeptBalance =
      payment.keepBalance && paymentAmount > invoiceTotal
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
}
