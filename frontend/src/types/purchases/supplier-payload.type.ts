import type { SupplierStatus } from './supplier.type';

/** Request body for `POST /suppliers`. */
export interface ISupplierPayload {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    creditTermDays?: number;
    openingBalance?: number;
    notes?: string;
}

/** Request body for `PATCH /suppliers/:id` — all fields optional. */
export interface ISupplierUpdatePayload extends Partial<ISupplierPayload> {
    status?: SupplierStatus;
}
