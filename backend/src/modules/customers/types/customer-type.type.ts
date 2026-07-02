/**
 * The kind of underlying record(s) a stitched customer is made of. A single
 * customer can carry more than one (e.g. a registered user who is also a khata
 * holder), so the API returns an array of these per customer.
 */
export const CUSTOMER_TYPES = ['registered', 'walk-in', 'khata'] as const;

export type CustomerType = (typeof CUSTOMER_TYPES)[number];
