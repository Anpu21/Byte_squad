export type DiscountSchemeScope = 'Product' | 'Category';

/**
 * Automatic POS discount rule. While active and inside its inclusive
 * date window, matching cart lines (by product or category, optionally
 * gated on a minimum-quantity slab) get `discountPercentage` applied at
 * add-time. `branchId` null means the rule runs in every branch.
 * Decimal columns may arrive as strings — coerce with `Number()`.
 */
export interface IDiscountScheme {
    id: string;
    name: string;
    branchId: string | null;
    scope: DiscountSchemeScope;
    productId: string | null;
    category: string | null;
    minQty: number;
    discountPercentage: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdByUserId: string;
    createdAt: string;
    updatedAt: string;
}

/** Create payload; update sends a partial of the same shape. */
export interface IDiscountSchemePayload {
    name: string;
    /** Omit for an all-branch scheme (admin only). */
    branchId?: string;
    scope: DiscountSchemeScope;
    productId?: string;
    category?: string;
    minQty?: number;
    discountPercentage: number;
    startDate: string;
    endDate: string;
    isActive?: boolean;
}

export interface IDiscountSchemesListResponse {
    rows: IDiscountScheme[];
    total: number;
}
