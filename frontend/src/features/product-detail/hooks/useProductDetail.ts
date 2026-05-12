import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import axios from 'axios';
import type { RootState } from '@/store';
import { shopProductsService } from '@/services/shop-products.service';
import { userService } from '@/services/user.service';
import { addToCart, clearShopCart } from '@/store/slices/shopCartSlice';
import { setUserBranch } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useConfirm } from '@/hooks/useConfirm';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';

export function useProductDetail() {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const confirm = useConfirm();
    const { user } = useAuth();
    const cartItems = useSelector((state: RootState) => state.shopCart.items);
    const userBranchId = user?.branchId ?? null;

    const [qty, setQty] = useState(1);

    const { data: product, isLoading } = useQuery({
        queryKey: queryKeys.shop.publicProduct(id ?? '', userBranchId),
        queryFn: () =>
            shopProductsService.getProduct(id!, userBranchId ?? undefined),
        enabled: !!id,
    });

    const availableIds = product?.availableBranches.map((b) => b.id) ?? [];
    const isOutEverywhere = availableIds.length === 0;
    const currentBranchHasIt =
        !!userBranchId && availableIds.includes(userBranchId);
    const branchSwitchNeeded =
        !!product && !currentBranchHasIt && !isOutEverywhere;

    const targetBranch =
        product?.availableBranches.find((b) => b.id === userBranchId) ??
        product?.availableBranches[0] ??
        null;

    const handleAdd = async (): Promise<boolean> => {
        if (!product) return false;
        if (isOutEverywhere) {
            toast.error("This product isn't stocked anywhere right now");
            return false;
        }

        if (branchSwitchNeeded) {
            if (cartItems.length > 0) {
                const ok = await confirm({
                    title: 'Switch pickup branch?',
                    body: `This item is at ${targetBranch?.name ?? 'another branch'}. Switching will clear your cart and update your profile pickup branch.`,
                    confirmLabel: 'Switch & clear cart',
                    tone: 'danger',
                });
                if (!ok) return false;
                dispatch(clearShopCart());
            }
            if (targetBranch) {
                try {
                    await userService.updateMyBranch(targetBranch.id);
                    dispatch(setUserBranch(targetBranch.id));
                } catch (err: unknown) {
                    if (axios.isAxiosError(err)) {
                        const data = err.response?.data as
                            | { message?: string }
                            | undefined;
                        toast.error(data?.message ?? 'Could not switch branch');
                    } else {
                        toast.error('Could not switch branch');
                    }
                    return false;
                }
            }
        }

        dispatch(
            addToCart({
                productId: product.id,
                name: product.name,
                sellingPrice: product.sellingPrice,
                imageUrl: product.imageUrl,
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

    return {
        product,
        isLoading,
        qty,
        increment: () => setQty((q) => q + 1),
        decrement: () => setQty((q) => Math.max(1, q - 1)),
        isOutEverywhere,
        branchSwitchNeeded,
        targetBranch,
        handleAdd,
        handleBuyNow,
    };
}
