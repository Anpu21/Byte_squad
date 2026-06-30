import type { IShopProduct, IShopSellableUnit } from '@/types';

/** Weight ('By weight') vs cash ('By amount') entry for a loose product. */
export type EntryMode = 'weight' | 'amount';

/** Branch-availability flags driving the out-of-stock / switch-branch UI. */
export interface BranchAvailability {
    isOutEverywhere: boolean;
    branchSwitchNeeded: boolean;
    targetBranch: IShopProduct['availableBranches'][number] | null;
}

/**
 * Resolve the active sellable unit: the explicitly chosen one, else the base
 * unit, else null (no product loaded yet).
 */
export function resolveSelectedUnit(
    product: IShopProduct | undefined,
    selectedUnitId: string | null,
): IShopSellableUnit | null {
    if (!product) return null;
    return (
        product.sellableUnits.find((u) => u.id === selectedUnitId) ??
        product.sellableUnits.find((u) => u.isBase) ??
        null
    );
}

/** Price of one chosen sellable unit, falling back to the product base price. */
export function resolveUnitPrice(
    selectedUnit: IShopSellableUnit | null,
    product: IShopProduct | undefined,
): number {
    return selectedUnit
        ? selectedUnit.sellingPrice
        : (product?.sellingPrice ?? 0);
}

/**
 * Stock availability derived from the loaded product: whether it is out across
 * every branch, whether browsing must switch branches to find it, and the
 * branch to switch to.
 */
export function deriveBranchAvailability(
    product: IShopProduct | undefined,
): BranchAvailability {
    const availableIds = product?.availableBranches.map((b) => b.id) ?? [];
    const isOutEverywhere =
        !!product && product.stockStatus === 'out' && availableIds.length === 0;
    const currentBranchHasIt = !!product && product.stockStatus !== 'out';
    const branchSwitchNeeded =
        !!product && !currentBranchHasIt && availableIds.length > 0;
    const targetBranch = product?.availableBranches[0] ?? null;
    return { isOutEverywhere, branchSwitchNeeded, targetBranch };
}
