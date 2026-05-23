/**
 * Frontend-only computation type used by the multi-tender form to gather
 * the per-method amounts and optional cheque metadata before constructing
 * the `ICreateSalePaymentPayload` on submit. The `tendered` field holds
 * the cash physically handed over so the receipt can show change.
 */
export interface IMultiTenderBag {
  cash: number;
  cheque: number;
  bank: number;
  credit: number;
  tendered: number;
  keepBalance: boolean;
  chequeNo?: string;
  chequeDate?: string;
  chequeBank?: string;
  chequeBranch?: string;
  chequeDeliveredBy?: string;
  chequeRef?: string;
  bankRef?: string;
}
