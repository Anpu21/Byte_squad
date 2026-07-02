/** How supplier bills get settled — Cash or Card, matching the shop's
 * cash + card (PayHere) payment policy. */
export const SUPPLIER_PAYMENT_METHODS = ['Cash', 'Card'] as const;

export type SupplierPaymentMethod = (typeof SUPPLIER_PAYMENT_METHODS)[number];
