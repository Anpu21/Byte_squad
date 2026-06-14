/** One category's sales for the requested window/branch scope. */
export interface CategorySalesRow {
  categoryId: string;
  categoryName: string;
  color: string | null;
  /** Units sold in the product base unit (SUM of sale_items.base_unit_qty). */
  units: number;
  /** Revenue (SUM of sale_items.line_total). */
  revenue: number;
  /** Distinct sales that included this category. */
  transactions: number;
  /** Revenue share of the window total, 0–100 (one decimal). */
  sharePct: number;
}
