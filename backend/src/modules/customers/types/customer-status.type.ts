/** Hub-level lifecycle flag, stored on `customer_profiles.status`. */
export const CUSTOMER_STATUSES = ['active', 'blocked'] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
