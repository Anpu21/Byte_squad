import type { TSalePaymentStatus } from './sale-payment-status.type';
import type { TSaleStatus } from './sale-status.type';
import type { TSaleType } from './sale-type.type';

/**
 * One row in the cashier's "recent sales" panel, returned by
 * `GET /pos/recent-sales`. Includes the Shanel-aligned fields the UI needs
 * to render payment-status badges, void state, bill-print state, and the
 * customer name for credit sales.
 */
export interface IRecentSaleRow {
  id: string;
  invoiceNumber: string;
  transactionNumber: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: TSalePaymentStatus;
  saleType: TSaleType;
  status: TSaleStatus;
  billPrinted: boolean;
  billPrintCount: number;
  branchId: string;
  customerUserId: string | null;
  customerName: string | null;
  createdAt: string;
}
