import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Search, Plus, ShoppingBag, Store } from 'lucide-react';
import type { RootState } from '@/store';
import { shopProductsService } from '@/services/shop-products.service';
import {
    addToCart,
    clearShopCart,
    setBranch,
} from '@/store/slices/shopCartSlice';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IShopProduct, ShopStockStatus } from '@/types';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

const STOCK_LABEL: Record<ShopStockStatus, string> = {
    in: 'In stock',
    low: 'Low stock',
    out: 'Out of stock',
};

const STOCK_PILL: Record<ShopStockStatus, string> = {
    in: 'bg-accent-soft text-accent-text border-accent/40',
    low: 'bg-warning-soft text-warning border-warning/40',
    out: 'bg-danger-soft text-danger border-danger/40',
};

const STOCK_DOT: Record<ShopStockStatus, string> = {
    in: 'bg-emerald-400',
    low: 'bg-amber-400',
    out: 'bg-rose-400',
};

export default function CatalogPage() {
    const dispatch = useDispatch();
    const branchId = useSelector(
        (state: RootState) => state.shopCart.branchId,
    );
    const cartItemCount = useSelector(
        (state: RootState) => state.shopCart.items.length,
    );

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string>('');
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

    const markImageFailed = (productId: string) =>
        setFailedImages((prev) => {
            if (prev.has(productId)) return prev;
            const next = new Set(prev);
            next.add(productId);
            return next;
        });

    const { data: branches = [], isLoading: branchesLoading } = useQuery({
        queryKey: ['shop-branches'],
        queryFn: shopProductsService.listBranches,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['shop-categories'],
        queryFn: shopProductsService.getCategories,
    });

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['shop-products', { branchId, category, search }],
        queryFn: () =>
            shopProductsService.listProducts({
                branchId: branchId!,
                category: category || undefined,
                search: search.trim() || undefined,
            }),
        enabled: Boolean(branchId),
    });

    const productCount = useMemo(() => products.length, [products]);

    const currentBranch = useMemo(
        () => branches.find((b) => b.id === branchId) ?? null,
        [branches, branchId],
    );

    const handleBranchChange = (newId: string) => {
        if (!newId || newId === branchId) return;
        if (cartItemCount > 0) {
            const ok = window.confirm(
                'Switching branch will clear your cart. Continue?',
            );
            if (!ok) return;
            dispatch(clearShopCart());
        }
        dispatch(setBranch(newId));
        setCategory('');
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

    useEffect(() => {
        if (!branchId && branches.length > 0) {
            dispatch(setBranch(branches[0].id));
        }
    }, [branchId, branches, dispatch]);

    if (!branchId) {
        if (!branchesLoading && branches.length === 0) {
            return (
                <div className="max-w-md mx-auto py-16">
                    <div className="bg-surface border border-border rounded-md p-7 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 border border-border mb-4">
                            <Store size={20} className="text-text-1" />
                        </div>
                        <h1 className="text-xl font-bold text-text-1 tracking-tight mb-1">
                            No branches available
                        </h1>
                        <p className="text-sm text-text-2">
                            Please check back later.
                        </p>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Browse products
                </h1>
                <p className="text-sm text-text-2 mt-1">
                    Showing items at{' '}
                    <span className="text-text-1 font-medium">
                        {currentBranch?.name ?? '…'}
                    </span>
                    . Switch any time.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <select
                    value={branchId}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-1 focus:outline-none focus:border-primary"
                >
                    {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name}
                        </option>
                    ))}
                </select>
                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products…"
                        className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-1 focus:outline-none focus:border-primary"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-1 focus:outline-none focus:border-primary"
                >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                </div>
            ) : productCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
                        <ShoppingBag size={20} className="text-text-2" />
                    </div>
                    <p className="text-sm font-semibold text-text-1">
                        No products found
                    </p>
                    <p className="text-xs text-text-3 mt-1">
                        Try a different search or category at this branch.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => {
                        const out = product.stockStatus === 'out';
                        const detailHref = FRONTEND_ROUTES.SHOP_PRODUCT_DETAIL.replace(
                            ':id',
                            product.id,
                        );
                        return (
                            <div
                                key={product.id}
                                className={`bg-surface border border-border rounded-md overflow-hidden hover:border-border-strong transition-colors ${
                                    out ? 'opacity-60' : ''
                                }`}
                            >
                                <Link
                                    to={detailHref}
                                    className="relative block aspect-square bg-canvas flex items-center justify-center overflow-hidden"
                                >
                                    {product.imageUrl && !failedImages.has(product.id) ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            onError={() => markImageFailed(product.id)}
                                            className={out ? 'w-full h-full object-cover grayscale' : 'w-full h-full object-cover'}
                                        />
                                    ) : (
                                        <span className="text-text-3 text-xs">No image</span>
                                    )}
                                    <span
                                        className={`absolute top-2 right-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${
                                            STOCK_PILL[product.stockStatus]
                                        }`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                STOCK_DOT[product.stockStatus]
                                            }`}
                                        />
                                        {STOCK_LABEL[product.stockStatus]}
                                    </span>
                                </Link>
                                <div className="p-3">
                                    <p className="text-[11px] text-text-3 uppercase tracking-widest">
                                        {product.category}
                                    </p>
                                    <Link to={detailHref} className="block">
                                        <h3 className="text-sm font-semibold text-text-1 mt-1 line-clamp-2 min-h-[2.5em] hover:text-primary transition-colors">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-text-1">
                                            {formatCurrency(product.sellingPrice)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleAdd(product)}
                                            disabled={out}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                                                out
                                                    ? 'bg-surface-2 text-text-3 cursor-not-allowed'
                                                    : 'bg-primary text-text-inv hover:bg-primary-hover'
                                            }`}
                                        >
                                            {out ? (
                                                'Out of stock'
                                            ) : (
                                                <>
                                                    <Plus size={12} /> Add
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    {out && product.availableBranches.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <p className="text-[10px] uppercase tracking-widest text-text-3 mb-1.5 flex items-center gap-1">
                                                <Store size={10} /> Available at
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {product.availableBranches.map((b) => (
                                                    <button
                                                        key={b.id}
                                                        type="button"
                                                        onClick={() => handleBranchChange(b.id)}
                                                        className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-accent-soft text-accent-text border border-accent/40 hover:bg-accent-soft transition-colors"
                                                    >
                                                        {b.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
