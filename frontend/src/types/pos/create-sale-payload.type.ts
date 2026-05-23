import type { TPaymentMethod } from './payment-method.type';
import type { TSaleType } from './sale-type.type';
import type { TPriceLevel } from './price-level.type';

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

export interface ICreateSalePayload {
  customerUserId?: string;
  saleType: TSaleType;
  priceLevel: TPriceLevel;
  location?: string;
  cartDiscountPercentage?: number;
  cartDiscountAmount?: number;
  items: ICreateSaleItemPayload[];
  payment: ICreateSalePaymentPayload;
}
