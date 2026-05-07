import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Search, Plus } from 'lucide-react';
import { publicProductsService } from '@/services/public-products.service';
import { addToCart } from '@/store/slices/shopCartSlice';
import type { IPublicProduct } from '@/types';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

export default function CatalogPage() {
    const dispatch = useDispatch();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string>('');

    const { data: categories = [] } = useQuery({
        queryKey: ['public-categories'],
        queryFn: publicProductsService.getCategories,
    });

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['public-products', { category, search }],
        queryFn: () =>
            publicProductsService.listProducts({
                category: category || undefined,
                search: search.trim() || undefined,
            }),
    });

    const productCount = useMemo(() => products.length, [products]);

    const handleAdd = (product: IPublicProduct) => {
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

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Browse products
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Add items to your cart, choose a branch at checkout, and pick them up
                    in store.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
                    No products match your search.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
                        >
                            <div className="aspect-square bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-slate-600 text-xs">No image</span>
                                )}
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
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-white text-black rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                        <Plus size={12} /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
