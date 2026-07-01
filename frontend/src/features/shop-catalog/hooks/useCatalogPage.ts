import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { shopProductsService } from '@/services/shop-products.service';
import { setActiveBranch } from '@/store/slices/shopBranchSlice';
import { selectActiveBranchId } from '@/store/selectors/shopBranch';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { useBuyAgain } from './useBuyAgain';
import { useCatalogAddToCart } from './useCatalogAddToCart';
import {
    ALL_STOCK,
    computeHasActiveFilters,
    computePriceCeiling,
    computeStockCounts,
    filterVisibleProducts,
    sortProducts,
    type CatalogSort,
} from './useCatalogPage.lib';
import type { ShopStockStatus } from '@/types';

export type { CatalogSort };

export function useCatalogPage() {
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    const activeBranchId = useAppSelector(selectActiveBranchId);

    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get('q') ?? '';
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState<CatalogSort>('name');
    // Client-side refinements over the server-filtered list (no extra query).
    const [stock, setStock] = useState<ShopStockStatus[]>(ALL_STOCK);
    const [maxPrice, setMaxPrice] = useState<number | null>(null);

    const setSearch = (value: string) =>
        setSearchParams(
            (prev) => {
                if (value) prev.set('q', value);
                else prev.delete('q');
                return prev;
            },
            { replace: true },
        );

    const clearSearch = () => setSearch('');

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

    // Availability counts span the full server result; the slider ceiling is the
    // dearest product, rounded up to a tidy step.
    const stockCounts = useMemo(() => computeStockCounts(products), [products]);

    const priceCeiling = useMemo(
        () => computePriceCeiling(products),
        [products],
    );

    const visibleProducts = useMemo(
        () => filterVisibleProducts(products, stock, maxPrice),
        [products, stock, maxPrice],
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

    const toggleStock = (value: ShopStockStatus) =>
        setStock((prev) =>
            prev.includes(value)
                ? prev.filter((s) => s !== value)
                : [...prev, value],
        );

    const clearFilters = () => {
        setCategory('');
        setStock(ALL_STOCK);
        setMaxPrice(null);
        setSearch('');
    };

    const hasActiveFilters = computeHasActiveFilters({
        search,
        category,
        stock,
        maxPrice,
    });

    // Free branch switching — keeps the cart so items can span branches.
    const handleBranchChange = (newId: string) => {
        if (!newId || newId === branchId) return;
        dispatch(setActiveBranch(newId));
        setCategory('');
    };

    const handleAdd = useCatalogAddToCart({
        branchId,
        branchName: currentBranch?.name ?? '',
    });

    return {
        branchId,
        activeBranchId,
        branches,
        branchesLoading: branchesQuery.isLoading,
        categories,
        products,
        visibleProducts,
        recommendedProducts,
        buyAgainProducts,
        productCount: visibleProducts.length,
        isLoading: productsQuery.isLoading,
        currentBranch,
        search,
        setSearch,
        clearSearch,
        category,
        setCategory,
        sort,
        setSort,
        stock,
        toggleStock,
        stockCounts,
        maxPrice,
        setMaxPrice,
        priceCeiling,
        clearFilters,
        hasActiveFilters,
        handleBranchChange,
        handleAdd,
    };
}
