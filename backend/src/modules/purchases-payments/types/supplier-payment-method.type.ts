/** How supplier bills get settled — deliberately just cash/bank transfer. */
export const SUPPLIER_PAYMENT_METHODS = ['Cash', 'Bank'] as const;

export type SupplierPaymentMethod = (typeof SUPPLIER_PAYMENT_METHODS)[number];
