import type { TPaymentMethod } from './payment-method.type';

/**
 * Frontend mirror of the backend `Payment` entity (1:1 with Sale). The POS
 * receives this back inside `ISale.payment` after `POST /pos/sales`. Holds
 * the multi-tender breakdown plus optional cheque/bank metadata.
 */
export interface ISalePayment {
  id: string;
  saleId: string;
  receiptNo: string;
  paymentMethod: TPaymentMethod;
  paymentAmount: number;
  invoiceTotal: number;
  cashTendered: number;
  cashAmount: number;
  cashChange: number;
  chequeAmount: number;
  bankTransferAmount: number;
  creditAmount: number;
  /** Money value of redeemed loyalty points settling this invoice. */
  loyaltyAmount: number;
  keepBalance: boolean;
  chequeNo: string | null;
  chequeDate: string | null;
  chequeBank: string | null;
  chequeBranch: string | null;
  chequeDeliveredBy: string | null;
  chequeRef: string | null;
  bankRef: string | null;
  status: 'Active' | 'Voided';
  createdAt: string;
  updatedAt: string;
}
