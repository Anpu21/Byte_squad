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

/**
 * Loyalty side-effect summary the backend appends to `POST /pos/sales`
 * when the cashier attached a loyalty owner. Mirrors
 * `CreateSaleLoyaltyResult` on the BE so the receipt footer can render
 * the earned/redeemed/balance trio without a follow-up wallet read.
 */
export interface ISaleLoyaltyResult {
  ownerType: 'user' | 'walkIn';
  earned: number;
  redeemed: number;
  newBalance: number;
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
  /**
   * Populated by `POST /pos/sales` when the cashier attached a loyalty
   * owner; absent on legacy/unattached sales. Optional so existing
   * snapshot consumers (recent-sales list, reprint flow) keep typing.
   */
  loyalty?: ISaleLoyaltyResult;
  createdAt: string;
}
