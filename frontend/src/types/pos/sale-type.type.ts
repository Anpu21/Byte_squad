/**
 * Top-level sale-type classification. The cashier UI no longer surfaces a
 * wholesale path — every new sale rings as `Retail` — but the union stays
 * here so historical 'Wholesale' rows persisted by the previous build
 * still type-check on read.
 */
export type TSaleType = 'Retail' | 'Wholesale';
