import type { ICustomerOrder, IShopProduct } from '@/types';

const VALID_STATUSES: ReadonlySet<string> = new Set([
    'pending',
    'accepted',
    'completed',
]);

export function buyAgainCandidates(
    orders: ReadonlyArray<ICustomerOrder>,
    catalog: ReadonlyArray<IShopProduct>,
    excludeIds: ReadonlyArray<string> = [],
    limit = 4,
): IShopProduct[] {
    if (orders.length === 0 || catalog.length === 0) return [];

    const counts = new Map<string, number>();
    for (const order of orders) {
        if (!VALID_STATUSES.has(order.status)) continue;
        for (const item of order.items ?? []) {
            const prev = counts.get(item.productId) ?? 0;
            counts.set(item.productId, prev + Number(item.quantity || 1));
        }
    }
    if (counts.size === 0) return [];

    const exclude = new Set(excludeIds);
    const byId = new Map(catalog.map((p) => [p.id, p]));

    const scored = Array.from(counts.entries())
        .filter(([id]) => !exclude.has(id))
        .map(([id, count]) => ({ product: byId.get(id), count }))
        .filter(
            (
                entry,
            ): entry is { product: IShopProduct; count: number } =>
                !!entry.product && entry.product.stockStatus !== 'out',
        )
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.product.name.localeCompare(b.product.name);
        });

    return scored.slice(0, limit).map((entry) => entry.product);
}
