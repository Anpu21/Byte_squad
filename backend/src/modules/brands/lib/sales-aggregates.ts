// Shared sale-item aggregate expressions for brand analytics queries. They
// assume the query builder aliases `item` (sale_items) and `product` (the
// item's joined product) — every brand analytics base query uses those names.
//
// Profit = revenue − COGS, where COGS uses the product's CURRENT cost price
// (cost-at-sale isn't stored on sale_items). Revenue/units are exact.
export const PROFIT_EXPR =
  'COALESCE(SUM(item.line_total) - SUM(product.cost_price * item.base_unit_qty), 0)';
export const REVENUE_EXPR = 'COALESCE(SUM(item.line_total), 0)';
export const UNITS_EXPR = 'COALESCE(SUM(item.base_unit_qty), 0)';
