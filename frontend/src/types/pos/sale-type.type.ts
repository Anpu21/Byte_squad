/**
 * Top-level sale-type classification. `Retail` is the default walk-in
 * cashier sale; `Wholesale` indicates a B2B / bulk-pricing sale that
 * uses the product's wholesale price column.
 */
export type TSaleType = 'Retail' | 'Wholesale';
