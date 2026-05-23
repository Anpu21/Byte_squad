/**
 * Pricing tier the cashier rang the line against. Same literal-union as
 * `TSaleType`, but exposed separately because the cart toggle (Retail vs
 * Wholesale) can be flipped independently from the sale-type classification.
 */
export type TPriceLevel = 'Retail' | 'Wholesale';
