export const PURCHASE_ORDER_STATUSES = [
  'Draft',
  'Sent',
  'Received',
  'Cancelled',
] as const;

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];
