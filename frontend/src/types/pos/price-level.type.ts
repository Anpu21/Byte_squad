/**
 * Pricing tier the cashier rang the line against. The Retail/Wholesale
 * toggle was removed from the cashier UI — every new sale rings at retail
 * — but the union stays here so historical 'Wholesale' rows persisted by
 * the previous build still type-check on read.
 */
export type TPriceLevel = 'Retail' | 'Wholesale';
