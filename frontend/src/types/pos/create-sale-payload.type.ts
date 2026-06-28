import type { TPaymentMethod } from './payment-method.type';

export interface ICreateSaleItemPayload {
  productId: string;
  unitId?: string;
  quantity: number;
  free?: number;
  unitPrice: number;
  discountPercentage?: number;
  taxRate?: number;
}

export interface ICreateSalePaymentPayload {
  paymentMethod: TPaymentMethod;
  paymentAmount: number;
  cashTendered?: number;
  cashAmount?: number;
  chequeAmount?: number;
  bankTransferAmount?: number;
  /** Portion of the sale funded by store credit (a khata "buy on credit"). */
  creditAmount?: number;
  chequeNo?: string;
  chequeDate?: string;
  chequeBank?: string;
  chequeBranch?: string;
  chequeDeliveredBy?: string;
  chequeRef?: string;
  bankRef?: string;
}

/**
 * Create-sale request body for `POST /pos/sales`. The wholesale price tier
 * was removed from the cashier UI so `saleType` / `priceLevel` are no
 * longer sent. The walk-in customer-picker was removed at the same time,
 * but `customerUserId` is re-introduced here as a pure loyalty-intent
 * field (set when the cashier attaches a registered-customer phone via
 * the loyalty card). `loyaltyCustomerId` is its walk-in twin, and
 * `loyaltyRedeemPoints` is the per-sale redeem amount.
 *
 * The backend rejects the combination `customerUserId && loyaltyCustomerId`
 * with a 400, so the FE always sets at most one.
 */
export interface ICreateSalePayload {
  location?: string;
  cartDiscountPercentage?: number;
  cartDiscountAmount?: number;
  items: ICreateSaleItemPayload[];
  payment: ICreateSalePaymentPayload;
  /** Registered-customer loyalty owner (mutually exclusive with `loyaltyCustomerId`). */
  customerUserId?: string;
  /** Walk-in loyalty owner (mutually exclusive with `customerUserId`). */
  loyaltyCustomerId?: string;
  /** Whole points to redeem against this sale. BE enforces the cap. */
  loyaltyRedeemPoints?: number;
  /**
   * Customer store-credit ("khata") account funding a buy-on-credit sale.
   * Mutually exclusive with `customerUserId` (the BE rejects the combination).
   */
  creditAccountId?: string;
  /** Short-lived manager-override token allowing an over-limit credit charge. */
  creditOverrideToken?: string;
}
