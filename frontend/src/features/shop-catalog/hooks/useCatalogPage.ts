import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import { shopProductsService } from '@/services/shop-products.service';
import { addToCart } from '@/store/slices/shopCartSlice';
import { setActiveBranch } from '@/store/slices/shopBranchSlice';
import { selectActiveBranchId } from '@/store/selectors/shopBranch';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { useBuyAgain } from './useBuyAgain';
import type { IShopProduct } from '@/types';

export type CatalogSort = 'name' | 'price_asc' | 'price_desc';

function sortProducts(
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

export function useCatalogPage() {
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    const activeBranchId = useAppSelector(selectActiveBranchId);

    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get('q') ?? '';
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState<CatalogSort>('name');

    const clearSearch = () => {
        setSearchParams(
            (prev) => {
                prev.delete('q');
                return prev;
            },
            { replace: true },
        );
    };

    const branchesQuery = useQuery({
        queryKey: queryKeys.shop.branches(),
        queryFn: shopProductsService.listBranches,
    });

    const branches = useMemo(
        () => branchesQuery.data ?? [],
        [branchesQuery.data],
    );

    // Default the browsing branch: prefer the customer's saved branch, else the
    // first active branch. Customers are no longer locked to a single branch.
    useEffect(() => {
        if (activeBranchId) return;
        const fallback = user?.branchId ?? branches[0]?.id ?? null;
        if (fallback) dispatch(setActiveBranch(fallback));
    }, [activeBranchId, user?.branchId, branches, dispatch]);

    const branchId = activeBranchId;

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

    const categories = categoriesQuery.data ?? [];
    const products = useMemo(
        () => sortProducts(productsQuery.data ?? [], sort),
        [productsQuery.data, sort],
    );
    const recommendedProducts = useMemo(
        () => recommendedQuery.data ?? [],
        [recommendedQuery.data],
    );

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

    // Free branch switching — keeps the cart so items can span branches.
    const handleBranchChange = (newId: string) => {
        if (!newId || newId === branchId) return;
        dispatch(setActiveBranch(newId));
        setCategory('');
    };

    const handleAdd = (product: IShopProduct, unitId: string | null = null) => {
        if (product.stockStatus === 'out' || !branchId) return;
        const unit =
            (unitId
                ? product.sellableUnits.find((u) => u.id === unitId)
                : product.sellableUnits.find((u) => u.isBase)) ?? null;
        dispatch(
            addToCart({
                productId: product.id,
                branchId,
                branchName: currentBranch?.name ?? '',
                name: product.name,
                sellingPrice: unit ? unit.sellingPrice : product.sellingPrice,
                imageUrl: product.imageUrl,
                unitId: unit ? unit.id : null,
                unitLabel: unit ? unit.name : product.baseUnit,
            }),
        );
        toast.success(`${product.name} added`);
    };

    return {
        branchId,
        activeBranchId,
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
        clearSearch,
        category,
        setCategory,
        sort,
        setSort,
        handleBranchChange,
        handleAdd,
    };
}
