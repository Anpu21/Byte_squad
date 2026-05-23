export * from './admin-dashboard-data.type';
export * from './cashier-dashboard-data.type';
export * from './cashier-period-stats.type';
export * from './cashier-transaction-row.type';
export * from './cashier-transactions-summary.type';
export * from './daily-breakdown.type';
export * from './top-product.type';

// Phase 2 — Shanel POS literal-union types
export type { SaleStatus } from './sale-status.type';
export type { SalePaymentStatus } from './sale-payment-status.type';
export type { PriceLevel } from './price-level.type';
export type { SaleType } from './sale-type.type';
// Re-exported as `PosPaymentMethod` to avoid clashing with the existing
// `PaymentMethod` enum at `@common/enums/payment-method` used by
// customer-orders.
export type { PaymentMethod as PosPaymentMethod } from './payment-method.type';

// Phase 4 — Shanel-aligned row types for the cashier read endpoints.
export type { SearchProductRow } from './search-product-row.type';
