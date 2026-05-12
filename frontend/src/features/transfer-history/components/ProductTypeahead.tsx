import { useMemo, useState } from 'react';
import type { IProduct } from '@/types';

interface ProductTypeaheadProps {
    products: IProduct[];
    selectedProduct: IProduct | null;
    onSelect: (id: string) => void;
    onClear: () => void;
}

const MAX_RESULTS = 8;

export function ProductTypeahead({
    products,
    selectedProduct,
    onSelect,
    onClear,
}: ProductTypeaheadProps) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    const results = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return [];
        return products
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.barcode.toLowerCase().includes(q),
            )
            .slice(0, MAX_RESULTS);
    }, [search, products]);

    if (selectedProduct) {
        return (
            <div className="flex items-center gap-2 h-10 px-3 bg-canvas border border-border rounded-lg">
                <span className="text-sm text-text-1 truncate flex-1">
                    {selectedProduct.name}
                </span>
                <button
                    type="button"
                    onClick={() => {
                        onClear();
                        setSearch('');
                    }}
                    className="text-text-3 hover:text-text-1 text-lg leading-none"
                    aria-label="Clear product filter"
                >
                    ×
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <label htmlFor="th-product-search" className="sr-only">
                Search product
            </label>
            <input
                id="th-product-search"
                type="text"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Search product or barcode…"
                className="w-full h-10 px-3 bg-canvas border border-border rounded-lg text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3"
            />
            {open && results.length > 0 && (
                <div className="absolute z-20 mt-1 left-0 right-0 bg-surface border border-border rounded-lg shadow-2xl max-h-56 overflow-y-auto">
                    {results.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                onSelect(p.id);
                                setSearch('');
                                setOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-surface-2 transition-colors"
                        >
                            <div className="font-medium">{p.name}</div>
                            <div className="text-[11px] text-text-3">
                                {p.barcode}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
