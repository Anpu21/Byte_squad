import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';
import type { UsePosCartReturn } from '@/features/pos/hooks/usePosCart';

/**
 * Wrap `usePosCart`'s `addItem` so a product is only staged when it actually
 * has stock at the cashier's branch. On every pick/scan it re-checks
 * `GET /pos/products/:id/inventory` (the purpose of `usePosProductInventory`'s
 * `staleTime: 0` endpoint); when `branchQty <= 0` the product isn't carried at
 * this branch, so we toast and skip the add instead of letting the sale fail at
 * checkout with "Product … is not stocked at this branch".
 *
 * Fails OPEN on a lookup error — the backend re-validates stock when the sale
 * is recorded (`pos-write.service.ts`), so a transient blip never blocks a
 * genuinely stocked product. The returned function keeps `addItem`'s exact
 * signature, so callers (entry-row pick + barcode scan) need no changes.
 */
export function usePosAddItemGuard(
    addItem: UsePosCartReturn['addItem'],
): UsePosCartReturn['addItem'] {
    const queryClient = useQueryClient();
    return useCallback<UsePosCartReturn['addItem']>(
        (seed) => {
            void (async () => {
                let available = true;
                try {
                    const inventory = await queryClient.fetchQuery({
                        queryKey: queryKeys.pos.productInventory(seed.productId),
                        queryFn: () =>
                            posService.getProductInventory(seed.productId),
                        staleTime: 0,
                    });
                    available = inventory.branchQty > 0;
                } catch {
                    // Fail open — the backend re-validates stock at checkout.
                    available = true;
                }
                if (!available) {
                    toast.error(
                        `${seed.productName} is out of stock at this branch`,
                    );
                    return;
                }
                addItem(seed);
            })();
        },
        [queryClient, addItem],
    );
}
