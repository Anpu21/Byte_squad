/**
 * One product worth reordering, with the figures behind the suggestion so a
 * buyer can sanity-check it. `suggestedQty` is the rounded-up shortfall:
 * velocityPerDay × leadDays + safety − onHand − onOrder (only emitted when > 0).
 */
export interface ReorderSuggestionLine {
  productId: string;
  productName: string;
  baseUnit: string;
  onHand: number;
  onOrder: number;
  /** The branch's low-stock threshold, used as the safety buffer. */
  safetyStock: number;
  velocityPerDay: number;
  suggestedQty: number;
  /** Last purchase cost (from the most recent GRN), else product cost price. */
  unitCost: number;
}

/** Suggestions grouped by the supplier last used to buy each product. */
export interface ReorderSupplierGroup {
  supplierId: string;
  supplierName: string;
  lines: ReorderSuggestionLine[];
  /** Σ suggestedQty × unitCost across the group's lines. */
  totalValue: number;
}

export interface ReorderSuggestionsReport {
  branchId: string;
  leadDays: number;
  lookbackDays: number;
  generatedAt: Date;
  groups: ReorderSupplierGroup[];
  /** Products that need reordering but have no GRN history to infer a supplier. */
  unassignedCount: number;
}
