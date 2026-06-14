export const GRN_PAYMENT_STATUSES = [
  'Unpaid',
  'Partially_Paid',
  'Paid',
] as const;

export type GrnPaymentStatus = (typeof GRN_PAYMENT_STATUSES)[number];
