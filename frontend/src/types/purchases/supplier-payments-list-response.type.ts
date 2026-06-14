import type { ISupplierPayment } from './supplier-payment.type';

/** Response shape of `GET /purchases/payments`. */
export interface ISupplierPaymentsListResponse {
    rows: ISupplierPayment[];
    total: number;
    limit: number;
    offset: number;
}
