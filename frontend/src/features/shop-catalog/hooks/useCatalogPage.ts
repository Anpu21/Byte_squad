import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import axios from 'axios';
import { shopProductsService } from '@/services/shop-products.service';
import { userService } from '@/services/user.service';
import { addToCart, clearShopCart } from '@/store/slices/shopCartSlice';
import { setUserBranch } from '@/store/slices/authSlice';
import { selectShopCartItemCount } from '@/store/selectors/shopCart';
import { useAuth } from '@/hooks/useAuth';
import { useConfirm } from '@/hooks/useConfirm';
import { queryKeys } from '@/lib/queryKeys';
import { useBuyAgain } from './useBuyAgain';
import type { IShopProduct } from '@/types';

export function useCatalogPage() {
    const dispatch = useAppDispatch();
    const confirm = useConfirm();
    const { user } = useAuth();
    const branchId = user?.branchId ?? null;
    const cartItemCount = useAppSelector(selectShopCartItemCount);

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');

    const branchesQuery = useQuery({
        queryKey: queryKeys.shop.branches(),
        queryFn: shopProductsService.listBranches,
    });

    const categoriesQuery = useQuery({
        queryKey: queryKeys.shop.categories(),
        queryFn: shopProductsService.getCategories,
    });

    const productsQuery = useQuery({
        queryKey: queryKeys.shop.products({ branchId, category, search }),
        queryFn: () =>
            shopProductsService.listProducts({
                branchId: branchId!,
                category: category || undefined,
                search: search.trim() || undefined,
            }),
        enabled: Boolean(branchId),
    });

    const recommendedQuery = useQuery({
        queryKey: queryKeys.shop.recommended({ branchId, limit: 4 }),
        queryFn: () =>
            shopProductsService.listRecommended({
                branchId: branchId!,
                limit: 4,
            }),
        enabled: Boolean(branchId),
    });

    const branches = useMemo(
        () => branchesQuery.data ?? [],
        [branchesQuery.data],
    );
    const categories = categoriesQuery.data ?? [];
    const products = productsQuery.data ?? [];
    const recommendedProducts = recommendedQuery.data ?? [];

    const excludeRecommendedIds = useMemo(
        () => recommendedProducts.map((p) => p.id),
        [recommendedProducts],
    );
    const buyAgainProducts = useBuyAgain({
        catalog: products,
        excludeIds: excludeRecommendedIds,
        enabled: Boolean(branchId),
        limit: 4,
    });

    const currentBranch = useMemo(
        () => branches.find((b) => b.id === branchId) ?? null,
        [branches, branchId],
    );

    const handleBranchChange = async (newId: string) => {
        if (!newId || newId === branchId) return;
        if (cartItemCount > 0) {
            const ok = await confirm({
                title: 'Switch pickup branch?',
                body: 'Switching to a different branch will clear your cart and update your profile pickup branch. Continue?',
                confirmLabel: 'Switch & clear cart',
                tone: 'danger',
            });
            if (!ok) return;
            dispatch(clearShopCart());
        }
        try {
            await userService.updateMyBranch(newId);
            dispatch(setUserBranch(newId));
            setCategory('');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not switch branch');
            } else {
                toast.error('Could not switch branch');
            }
        }
    };

    const handleAdd = (product: IShopProduct) => {
        if (product.stockStatus === 'out') return;
        dispatch(
            addToCart({
                productId: product.id,
                name: product.name,
                sellingPrice: product.sellingPrice,
                imageUrl: product.imageUrl,
            }),
        );
        toast.success(`${product.name} added`);
    };

    return {
        branchId,
        branches,
        branchesLoading: branchesQuery.isLoading,
        categories,
        products,
        recommendedProducts,
        buyAgainProducts,
        productCount: products.length,
        isLoading: productsQuery.isLoading,
        currentBranch,
        search,
        setSearch,
        category,
        setCategory,
        handleBranchChange,
        handleAdd,
    };
}
