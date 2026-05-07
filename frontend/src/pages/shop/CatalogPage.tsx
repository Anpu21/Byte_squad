import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Search, Plus, Store } from 'lucide-react';
import type { RootState } from '@/store';
import { shopProductsService } from '@/services/shop-products.service';
import {
    addToCart,
    clearShopCart,
    setBranch,
} from '@/store/slices/shopCartSlice';
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
    in: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    low: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    out: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
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

    if (!branchId) {
        return (
            <div className="max-w-md mx-auto py-16">
                <div className="bg-[#111] border border-white/10 rounded-2xl p-7 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4">
                        <Store size={20} className="text-slate-300" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight mb-1">
                        Choose your branch
                    </h1>
                    <p className="text-sm text-slate-400 mb-6">
                        Pick the branch you want to shop from. We&apos;ll only show items
                        that branch carries.
                    </p>
                    <select
                        value=""
                        onChange={(e) => handleBranchChange(e.target.value)}
                        disabled={branchesLoading}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">
                            {branchesLoading ? 'Loading branches…' : 'Select a branch'}
                        </option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name} — {b.address}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Browse products
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Showing items at{' '}
                    <span className="text-slate-200 font-medium">
                        {currentBranch?.name ?? '…'}
                    </span>
                    . Switch any time.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <select
                    value={branchId}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
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
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products…"
                        className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
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
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            ) : productCount === 0 ? (
                <div className="text-center py-24 text-slate-500 text-sm">
                    No products match your search at this branch.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => {
                        const out = product.stockStatus === 'out';
                        return (
                            <div
                                key={product.id}
                                className={`bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors ${
                                    out ? 'opacity-60' : ''
                                }`}
                            >
                                <div className="relative aspect-square bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className={out ? 'w-full h-full object-cover grayscale' : 'w-full h-full object-cover'}
                                        />
                                    ) : (
                                        <span className="text-slate-600 text-xs">No image</span>
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
                                </div>
                                <div className="p-3">
                                    <p className="text-[11px] text-slate-500 uppercase tracking-widest">
                                        {product.category}
                                    </p>
                                    <h3 className="text-sm font-semibold text-white mt-1 line-clamp-2 min-h-[2.5em]">
                                        {product.name}
                                    </h3>
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <p className="text-sm font-bold text-white">
                                            {formatCurrency(product.sellingPrice)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleAdd(product)}
                                            disabled={out}
                                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors ${
                                                out
                                                    ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                                                    : 'bg-white text-black hover:bg-slate-200'
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
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1">
                                                <Store size={10} /> Available at
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {product.availableBranches.map((b) => (
                                                    <button
                                                        key={b.id}
                                                        type="button"
                                                        onClick={() => handleBranchChange(b.id)}
                                                        className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
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
