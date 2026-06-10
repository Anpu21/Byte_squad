export const SUPPLIER_STATUSES = ['Active', 'Inactive'] as const;

export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];
