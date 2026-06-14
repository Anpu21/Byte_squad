import type { ISupplier } from './supplier.type';

/** Response shape of `GET /suppliers`. */
export interface ISuppliersListResponse {
    rows: ISupplier[];
    total: number;
    limit: number;
    offset: number;
}
