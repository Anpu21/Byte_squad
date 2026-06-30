import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import { shopProductsService } from '@/services/shop-products.service';
import { addToCart } from '@/store/slices/shopCartSlice';
import { setActiveBranch } from '@/store/slices/shopBranchSlice';
import { selectActiveBranchId } from '@/store/selectors/shopBranch';
import { selectShopContext } from '@/store/selectors/shopContext';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { useBuyAgain } from './useBuyAgain';
import { useAddGroupCartItem } from '@/features/customer-groups/hooks/useAddGroupCartItem';
import type { IShopProduct, ShopStockStatus } from '@/types';

export type CatalogSort = 'name' | 'price_asc' | 'price_desc';

const ALL_STOCK: ShopStockStatus[] = ['in', 'low', 'out'];

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
    const shopContext = useAppSelector(selectShopContext);
    const addGroupItem = useAddGroupCartItem();

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
    const stockCounts = useMemo(() => {
        const counts: Record<ShopStockStatus, number> = { in: 0, low: 0, out: 0 };
        for (const item of products) counts[item.stockStatus] += 1;
        return counts;
    }, [products]);

    const priceCeiling = useMemo(() => {
        if (products.length === 0) return 0;
        const max = Math.max(...products.map((item) => item.sellingPrice));
        return Math.ceil(max / 50) * 50;
    }, [products]);

    const visibleProducts = useMemo(
        () =>
            products.filter(
                (item) =>
                    stock.includes(item.stockStatus) &&
                    (maxPrice == null || item.sellingPrice <= maxPrice),
            ),
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

    const hasActiveFilters =
        Boolean(search) ||
        Boolean(category) ||
        stock.length !== ALL_STOCK.length ||
        maxPrice != null;

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
                branchName: currentBranch?.name ?? '',
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
