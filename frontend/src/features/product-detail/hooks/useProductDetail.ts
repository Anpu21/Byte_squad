import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import { shopProductsService } from '@/services/shop-products.service';
import { addToCart } from '@/store/slices/shopCartSlice';
import { setActiveBranch } from '@/store/slices/shopBranchSlice';
import { selectActiveBranchId } from '@/store/selectors/shopBranch';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IShopProduct, IShopSellableUnit } from '@/types';

export function useProductDetail() {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAuth();
    const activeBranchId = useAppSelector(selectActiveBranchId);
    const branchId = activeBranchId ?? user?.branchId ?? null;

    const [qty, setQty] = useState(1);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

    const branchesQuery = useQuery({
        queryKey: queryKeys.shop.branches(),
        queryFn: shopProductsService.listBranches,
    });
    const branchName = useMemo(
        () =>
            branchesQuery.data?.find((b) => b.id === branchId)?.name ?? '',
        [branchesQuery.data, branchId],
    );

    const { data: product, isLoading } = useQuery({
        queryKey: queryKeys.shop.publicProduct(id ?? '', branchId),
        queryFn: () =>
            shopProductsService.getProduct(id!, branchId ?? undefined),
        enabled: !!id,
    });

    const { data: recommendedProducts = [] } = useQuery({
        queryKey: queryKeys.shop.recommended({
            branchId,
            productId: id,
            category: product?.category,
            limit: 4,
        }),
        queryFn: () =>
            shopProductsService.listRecommended({
                branchId: branchId!,
                productId: id,
                category: product?.category,
                limit: 4,
            }),
        enabled: Boolean(branchId && id && product),
    });

    const selectedUnit: IShopSellableUnit | null = useMemo(() => {
        if (!product) return null;
        return (
            product.sellableUnits.find((u) => u.id === selectedUnitId) ??
            product.sellableUnits.find((u) => u.isBase) ??
            null
        );
    }, [product, selectedUnitId]);

    const unitPrice = selectedUnit
        ? selectedUnit.sellingPrice
        : (product?.sellingPrice ?? 0);

    const availableIds = product?.availableBranches.map((b) => b.id) ?? [];
    const isOutEverywhere =
        !!product && product.stockStatus === 'out' && availableIds.length === 0;
    const currentBranchHasIt = !!product && product.stockStatus !== 'out';
    const branchSwitchNeeded =
        !!product && !currentBranchHasIt && availableIds.length > 0;
    const targetBranch = product?.availableBranches[0] ?? null;

    // Switch the browsing branch — keeps the cart (items can span branches).
    const handleSwitchBranch = () => {
        if (targetBranch) dispatch(setActiveBranch(targetBranch.id));
    };

    const handleAdd = async (): Promise<boolean> => {
        if (!product || !branchId) return false;
        if (product.stockStatus === 'out') {
            toast.error('Out of stock at this branch');
            return false;
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
                quantity: qty,
            }),
        );
        toast.success(`${product.name} × ${qty} added`);
        return true;
    };

    const handleBuyNow = async () => {
        const added = await handleAdd();
        if (added) navigate(FRONTEND_ROUTES.SHOP_CART);
    };

    const handleAddRecommended = (recommended: IShopProduct) => {
        if (recommended.stockStatus === 'out' || !branchId) return;
        const base =
            recommended.sellableUnits.find((u) => u.isBase) ?? null;
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
            }),
        );
        toast.success(`${recommended.name} added`);
    };

    return {
        product,
        isLoading,
        qty,
        increment: () => setQty((q) => q + 1),
        decrement: () => setQty((q) => Math.max(1, q - 1)),
        units: product?.sellableUnits ?? [],
        // Effective unit id (falls back to base) so the unit <Select> stays controlled.
        selectedUnitId: selectedUnit?.id ?? null,
        setSelectedUnitId,
        unitPrice,
        isOutEverywhere,
        branchSwitchNeeded,
        targetBranch,
        handleSwitchBranch,
        recommendedProducts,
        handleAddRecommended,
        handleAdd,
        handleBuyNow,
    };
}
