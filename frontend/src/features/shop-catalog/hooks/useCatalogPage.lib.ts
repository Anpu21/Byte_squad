import type { IShopProduct, ShopStockStatus } from '@/types';

export type CatalogSort = 'name' | 'price_asc' | 'price_desc';

/** Every stock status — the default (unfiltered) availability selection. */
export const ALL_STOCK: ShopStockStatus[] = ['in', 'low', 'out'];

/** Returns a new, sorted copy of the catalog for the chosen sort order. */
export function sortProducts(
    products: IShopProduct[],
    sort: CatalogSort,
): IShopProduct[] {
    const copy = products.slice();
    switch (sort) {
        case 'price_asc':
            return copy.sort((a, b) => a.sellingPrice - b.sellingPrice);
        case 'price_desc':
            return copy.sort((a, b) => b.sellingPrice - a.sellingPrice);
        default:
            return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
}

/** Tallies how many products fall into each availability bucket. */
export function computeStockCounts(
    products: IShopProduct[],
): Record<ShopStockStatus, number> {
    const counts: Record<ShopStockStatus, number> = { in: 0, low: 0, out: 0 };
    for (const item of products) counts[item.stockStatus] += 1;
    return counts;
}

/** Dearest product price, rounded up to a tidy step for the slider ceiling. */
export function computePriceCeiling(products: IShopProduct[]): number {
    if (products.length === 0) return 0;
    const max = Math.max(...products.map((item) => item.sellingPrice));
    return Math.ceil(max / 50) * 50;
}

/** Client-side refinement: keep products matching the stock + price filters. */
export function filterVisibleProducts(
    products: IShopProduct[],
    stock: ShopStockStatus[],
    maxPrice: number | null,
): IShopProduct[] {
    return products.filter(
        (item) =>
            stock.includes(item.stockStatus) &&
            (maxPrice == null || item.sellingPrice <= maxPrice),
    );
}

/** True when any search, category, stock, or price filter is in effect. */
export function computeHasActiveFilters(args: {
    search: string;
    category: string;
    stock: ShopStockStatus[];
    maxPrice: number | null;
}): boolean {
    return (
        Boolean(args.search) ||
        Boolean(args.category) ||
        args.stock.length !== ALL_STOCK.length ||
        args.maxPrice != null
    );
}
