import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/shopCartSlice';
import { selectShopContext } from '@/store/selectors/shopContext';
import { useAddGroupCartItem } from '@/features/customer-groups/hooks/useAddGroupCartItem';
import type { IShopProduct } from '@/types';

interface CatalogAddToCartArgs {
    branchId: string | null;
    branchName: string;
}

/**
 * Builds the catalog "add to cart" handler. In group mode adds feed the
 * group's shared cart (server-persisted, live-synced); otherwise they hit the
 * personal Redux cart.
 */
export function useCatalogAddToCart({
    branchId,
    branchName,
}: CatalogAddToCartArgs) {
    const dispatch = useAppDispatch();
    const shopContext = useAppSelector(selectShopContext);
    const addGroupItem = useAddGroupCartItem();

    return (product: IShopProduct, unitId: string | null = null) => {
        if (product.stockStatus === 'out' || !branchId) return;
        const unit =
            (unitId
                ? product.sellableUnits.find((u) => u.id === unitId)
                : product.sellableUnits.find((u) => u.isBase)) ?? null;
        // In group mode, adds feed the group's shared cart (server-persisted,
        // live-synced) instead of the personal Redux cart.
        if (shopContext.mode === 'group' && shopContext.groupId) {
            addGroupItem.mutate(
                {
                    id: shopContext.groupId,
                    payload: {
                        productId: product.id,
                        branchId,
                        unitId: unit?.id ?? undefined,
                        quantity: 1,
                    },
                },
                {
                    onSuccess: () =>
                        toast.success(
                            `Added to ${shopContext.groupName ?? 'group'}`,
                        ),
                    onError: () =>
                        toast.error('Could not add to the group cart'),
                },
            );
            return;
        }
        dispatch(
            addToCart({
                productId: product.id,
                branchId,
                branchName,
                name: product.name,
                sellingPrice: unit ? unit.sellingPrice : product.sellingPrice,
                imageUrl: product.imageUrl,
                unitId: unit ? unit.id : null,
                unitLabel: unit ? unit.name : product.baseUnit,
                baseUnit: product.baseUnit,
            }),
        );
        toast.success(`${product.name} added`);
    };
}
