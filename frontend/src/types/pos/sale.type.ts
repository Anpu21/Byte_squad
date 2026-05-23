import type {
  TransactionType,
  DiscountType,
  PaymentMethod,
} from '@/constants/enums';
import type { ISaleItem } from './sale-item.type';
import type { ISalePayment } from './sale-payment.type';
import type { TSaleType } from './sale-type.type';
import type { TPriceLevel } from './price-level.type';
import type { TSalePaymentStatus } from './sale-payment-status.type';
import type { TSaleStatus } from './sale-status.type';

/**
 * Trimmed customer snapshot the backend eager-loads onto `Sale.customer`.
 * The bill template needs the name to print "Customer: First Last"; full
 * IUser would force the print layer to depend on auth shape unnecessarily.
 */
export interface ISaleCustomerSnapshot {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ISale {
  id: string;
  transactionNumber: string;
  invoiceNumber: string;
  billPrinted: boolean;
  billPrintCount: number;
  firstPrintDate: string | null;
  lastPrintDate: string | null;
  branchId: string;
  cashierId: string;
  type: TransactionType;
  subtotal: number;
  discountAmount: number;
  discountType: DiscountType;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  saleType: TSaleType;
  priceLevel: TPriceLevel;
  discountPercentage: number;
  taxRate: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: TSalePaymentStatus;
  status: TSaleStatus;
  location: string;
  customerUserId: string | null;
  voidedReason: string | null;
  voidedAt: string | null;
  voidedByUserId: string | null;
  items?: ISaleItem[];
  payment?: ISalePayment;
  customer?: ISaleCustomerSnapshot | null;
  createdAt: string;
}
