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
 * and the walk-in customer-picker were removed from the cashier UI, so
 * `saleType` / `priceLevel` / `customerUserId` are no longer sent. The
 * backend DTO still accepts `customerUserId` and the credit/keep-balance
 * tender fields for legacy callers (admin imports, recovery scripts);
 * the FE simply stops emitting them.
 */
export interface ICreateSalePayload {
  location?: string;
  cartDiscountPercentage?: number;
  cartDiscountAmount?: number;
  items: ICreateSaleItemPayload[];
  payment: ICreateSalePaymentPayload;
}
