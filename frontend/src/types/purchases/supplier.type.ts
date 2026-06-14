/**
 * Supplier master row as returned by `GET /suppliers`. Mirrors the
 * `suppliers` entity — global (not branch-scoped); purchase documents
 * carry the branch. Suppliers are records, not logins.
 */
export type SupplierStatus = 'Active' | 'Inactive';

export interface ISupplier {
    id: string;
    name: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    /** Bill due date = GRN date + this many days. */
    creditTermDays: number;
    /** Amount owed at onboarding; counts into outstanding. */
    openingBalance: number;
    status: SupplierStatus;
    userId: string | null;
    notes: string | null;
    createdByUserId: string;
    createdAt: string;
    updatedAt: string;
}
