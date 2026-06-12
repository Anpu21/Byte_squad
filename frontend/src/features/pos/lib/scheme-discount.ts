import type { IDiscountScheme } from '@/types';

export interface ISchemeMatchInput {
    productId: string;
    /** The cart row's `productType` — mirrors `Product.category`. */
    category: string;
    quantity: number;
}

/**
 * Pick the discount % the active schemes give one cart line.
 *
 * The server already filtered to today's in-window rules for the
 * branch, so this only matches scope and the quantity slab:
 * product-specific rules beat category rules, and within a tier the
 * highest percentage wins. Returns 0 when nothing bites — the caller
 * leaves the line untouched (a cashier's manual discount always wins).
 */
export function resolveSchemeDiscount(
    schemes: IDiscountScheme[],
    input: ISchemeMatchInput,
): number {
    let productBest = 0;
    let categoryBest = 0;
    for (const scheme of schemes) {
        if (!scheme.isActive) continue;
        if (input.quantity < Number(scheme.minQty)) continue;
        const pct = Number(scheme.discountPercentage);
        if (!Number.isFinite(pct) || pct <= 0) continue;
        if (
            scheme.scope === 'Product' &&
            scheme.productId === input.productId
        ) {
            productBest = Math.max(productBest, pct);
        } else if (
            scheme.scope === 'Category' &&
            scheme.category !== null &&
            scheme.category.toLowerCase() === input.category.toLowerCase()
        ) {
            categoryBest = Math.max(categoryBest, pct);
        }
    }
    return productBest > 0 ? productBest : categoryBest;
}
