export const GRN_STATUSES = ['Received', 'Voided'] as const;

export type GrnStatus = (typeof GRN_STATUSES)[number];
