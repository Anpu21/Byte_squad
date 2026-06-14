import type { IPurchaseOrder } from './purchase-order.type';

/** Response shape of `GET /purchases/orders`. */
export interface IPurchaseOrdersListResponse {
    rows: IPurchaseOrder[];
    total: number;
    limit: number;
    offset: number;
}
