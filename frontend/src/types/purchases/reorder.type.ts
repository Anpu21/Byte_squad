export interface IReorderSuggestionLine {
    productId: string;
    productName: string;
    baseUnit: string;
    onHand: number;
    onOrder: number;
    safetyStock: number;
    velocityPerDay: number;
    suggestedQty: number;
    unitCost: number;
}

export interface IReorderSupplierGroup {
    supplierId: string;
    supplierName: string;
    lines: IReorderSuggestionLine[];
    totalValue: number;
}

export interface IReorderSuggestionsReport {
    branchId: string;
    leadDays: number;
    lookbackDays: number;
    generatedAt: string;
    groups: IReorderSupplierGroup[];
    /** Low items with no GRN history to infer a supplier from. */
    unassignedCount: number;
}
