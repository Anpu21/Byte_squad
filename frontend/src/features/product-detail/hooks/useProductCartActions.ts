import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart } from '@/store/slices/shopCartSlice';
import { selectShopContext } from '@/store/selectors/shopContext';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useAddGroupCartItem } from '@/features/customer-groups/hooks/useAddGroupCartItem';
import { formatQty } from '@/lib/unit-quantity';
import type { IShopProduct, IShopSellableUnit } from '@/types';
import type { EntryMode } from './useProductDetail.lib';

/** Current selection the cart actions price and label a line from. */
interface UseProductCartActionsArgs {
    product: IShopProduct | undefined;
    branchId: string | null;
    branchName: string;
    selectedUnit: IShopSellableUnit | null;
    unitPrice: number;
    qty: number;
    amount: number;
    isFractional: boolean;
    entryMode: EntryMode;
    derivedQty: number;
    qtyUnitLabel: string;
}

/**
 * Cart / group-cart write actions for the product detail page. The page hook
 * feeds it the priced selection; group routing + the shop context live here so
 * the page hook stays focused on read state.
 */
export function useProductCartActions(args: UseProductCartActionsArgs) {
    const {
        product,
        branchId,
        branchName,
        selectedUnit,
        unitPrice,
        qty,
        amount,
        isFractional,
        entryMode,
        derivedQty,
        qtyUnitLabel,
    } = args;
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const shopContext = useAppSelector(selectShopContext);
    const addGroupItem = useAddGroupCartItem();

    const handleAdd = async (): Promise<boolean> => {
        if (!product || !branchId) return false;
        if (product.stockStatus === 'out') {
            toast.error('Out of stock at this branch');
            return false;
        }
        // Amount lines carry the firm cash the customer named; the weight is the
        // derived estimate. Weight lines carry no amount (priced by quantity).
        const isAmountLine = isFractional && entryMode === 'amount';
        const lineQty = isAmountLine ? derivedQty : qty;
        if (shopContext.mode === 'group' && shopContext.groupId) {
            try {
                await addGroupItem.mutateAsync({
                    id: shopContext.groupId,
                    payload: {
                        productId: product.id,
                        branchId,
                        unitId: selectedUnit?.id ?? undefined,
                        quantity: lineQty,
                        amount: isAmountLine ? amount : undefined,
                    },
                });
                toast.success(`Added to ${shopContext.groupName ?? 'group'}`);
                return true;
            } catch {
                toast.error('Could not add to the group cart');
                return false;
            }
        }
        dispatch(
            addToCart({
                productId: product.id,
                branchId,
                branchName,
                name: product.name,
                sellingPrice: unitPrice,
                imageUrl: product.imageUrl,
                unitId: selectedUnit ? selectedUnit.id : null,
                unitLabel: selectedUnit ? selectedUnit.name : product.baseUnit,
                baseUnit: product.baseUnit,
                quantity: lineQty,
                amount: isAmountLine ? amount : null,
            }),
        );
        toast.success(
            `${product.name} × ${formatQty(lineQty, qtyUnitLabel)} added`,
        );
        return true;
    };

    const handleBuyNow = async () => {
        const added = await handleAdd();
        if (!added) return;
        if (shopContext.mode === 'group' && shopContext.groupId) {
            navigate(
                FRONTEND_ROUTES.SHOP_GROUP_DETAIL.replace(
                    ':id',
                    shopContext.groupId,
                ),
            );
        } else {
            navigate(FRONTEND_ROUTES.SHOP_CART);
        }
    };

    const handleAddRecommended = (recommended: IShopProduct) => {
        if (recommended.stockStatus === 'out' || !branchId) return;
        const base =
            recommended.sellableUnits.find((u) => u.isBase) ?? null;
        if (shopContext.mode === 'group' && shopContext.groupId) {
            addGroupItem.mutate(
                {
                    id: shopContext.groupId,
                    payload: {
                        productId: recommended.id,
                        branchId,
                        unitId: base?.id ?? undefined,
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
                productId: recommended.id,
                branchId,
                branchName,
                name: recommended.name,
                sellingPrice: base ? base.sellingPrice : recommended.sellingPrice,
                imageUrl: recommended.imageUrl,
                unitId: base ? base.id : null,
                unitLabel: base ? base.name : recommended.baseUnit,
                baseUnit: recommended.baseUnit,
            }),
        );
        toast.success(`${recommended.name} added`);
    };

    return { handleAdd, handleBuyNow, handleAddRecommended };
}
