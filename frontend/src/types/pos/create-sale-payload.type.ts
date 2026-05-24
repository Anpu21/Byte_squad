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
  creditAmount?: number;
  keepBalance?: boolean;
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
 * was removed from the cashier UI; `saleType` / `priceLevel` are no longer
 * sent and the backend DTO defaults both to `'Retail'` server-side.
 */
export interface ICreateSalePayload {
  customerUserId?: string;
  location?: string;
  cartDiscountPercentage?: number;
  cartDiscountAmount?: number;
  items: ICreateSaleItemPayload[];
  payment: ICreateSalePaymentPayload;
}
