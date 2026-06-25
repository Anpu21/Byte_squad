import type { SaleStatus } from './sale-status.type';
import type { SalePaymentStatus } from './sale-payment-status.type';
import type { SaleType } from './sale-type.type';

/**
 * One row in the cashier's "recent sales" panel, returned by
 * `GET /pos/recent-sales`. Extends the legacy CashierTransactionRow with the
 * Shanel-aligned fields the new UI needs to render payment-status badges,
 * void state, bill-print state, and the customer name for credit sales.
 */
export interface RecentSaleRow {
  id: string;
  invoiceNumber: string;
  transactionNumber: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: SalePaymentStatus;
  saleType: SaleType;
  status: SaleStatus;
  billPrinted: boolean;
  billPrintCount: number;
  branchId: string;
  customerUserId: string | null;
  customerName: string | null;
  createdAt: Date;
}
