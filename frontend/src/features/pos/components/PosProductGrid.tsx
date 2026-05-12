import { Search } from 'lucide-react';
import type { IProduct } from '@/types';
import { formatCurrency } from '@/lib/utils';
import type { CartItem } from '../types/cart-item.type';

interface PosProductGridProps {
    results: IProduct[];
    isSearching: boolean;
    cart: CartItem[];
    pendingQty: number | null;
    query: string;
    onSelectProduct: (product: IProduct) => void;
}

export default function PosProductGrid({
    results,
    isSearching,
    cart,
    pendingQty,
    query,
    onSelectProduct,
}: PosProductGridProps) {
    if (isSearching) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-surface border border-border rounded-xl p-4 animate-pulse"
                    >
                        <div className="h-4 w-3/4 bg-surface-2 rounded mb-3" />
                        <div className="h-3 w-1/2 bg-surface-2 rounded mb-4" />
                        <div className="h-6 w-1/3 bg-surface-2 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (results.length > 0) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {results.map((product) => {
                    const inCart = cart.find((c) => c.product.id === product.id);
                    return (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => onSelectProduct(product)}
                            className="bg-surface border border-border rounded-xl p-4 text-left hover:bg-surface-2 hover:border-border-strong transition-all group relative"
                        >
                            {inCart && (
                                <span className="absolute top-2 right-2 text-[10px] font-bold bg-primary text-text-inv rounded-full w-5 h-5 flex items-center justify-center">
                                    {inCart.quantity}
                                </span>
                            )}
                            {pendingQty && (
                                <span className="absolute top-2 left-2 text-[10px] font-bold bg-primary-soft text-text-1 rounded px-1.5 py-0.5">
                                    {pendingQty}x
                                </span>
                            )}
                            <p className="text-sm font-semibold text-text-1 truncate mb-1">
                                {product.name}
                            </p>
                            <p className="text-[11px] text-text-3 mb-1 truncate">
                                {product.category}
                            </p>
                            <p className="text-[11px] text-text-3 mb-3 font-mono">
                                {product.barcode}
                            </p>
                            <p className="text-sm font-bold text-text-1 tabular-nums">
                                {formatCurrency(Number(product.sellingPrice))}
                            </p>
                        </button>
                    );
                })}
            </div>
        );
    }

    if (query.trim()) {
        return (
            <div className="bg-surface border border-border rounded-md flex flex-col items-center justify-center p-12 h-full">
                <Search size={32} strokeWidth={1.5} className="text-text-3 mb-3" />
                <p className="text-sm text-text-2">No products found for "{query}"</p>
            </div>
        );
    }

    return <PosReadyState />;
}

function PosReadyState() {
    return (
        <div className="bg-surface border border-border rounded-md shadow-2xl flex flex-col items-center justify-center p-8 h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-surface-2 blur-xl rounded-full" />
                    <div className="w-20 h-20 bg-surface-2 border border-border rounded-3xl flex items-center justify-center relative z-10">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className="text-text-1"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                            <line x1="7" y1="7" x2="7" y2="17" />
                            <line x1="12" y1="7" x2="12" y2="17" />
                            <line x1="17" y1="7" x2="17" y2="17" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-xl font-bold text-text-1 mb-2 tracking-tight">
                    Ready to Scan
                </h3>
                <p className="text-sm text-text-2 max-w-[280px]">
                    Scan a barcode or search by name to add items to the cart.
                </p>
                <div className="flex items-center gap-4 mt-6 text-[11px] text-text-3">
                    <span>
                        <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 text-text-2 font-bold">
                            F2
                        </kbd>{' '}
                        Search
                    </span>
                    <span>
                        <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 text-text-2 font-bold">
                            F12
                        </kbd>{' '}
                        Checkout
                    </span>
                    <span>
                        <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 text-text-2 font-bold">
                            ESC
                        </kbd>{' '}
                        Close
                    </span>
                </div>
            </div>
        </div>
    );
}
