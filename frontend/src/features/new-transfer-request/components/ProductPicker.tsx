import type { IProduct } from '@/types';

interface ProductPickerProps {
    search: string;
    setSearch: (v: string) => void;
    products: IProduct[];
    isLoading: boolean;
    selectedId: string;
    onSelect: (id: string) => void;
    selectedProduct: IProduct | null;
    remainingCount: number;
    onShowMore: () => void;
    error?: string;
}

const PAGE_SIZE_INCREMENT = 50;

export function ProductPicker({
    search,
    setSearch,
    products,
    isLoading,
    selectedId,
    onSelect,
    selectedProduct,
    remainingCount,
    onShowMore,
    error,
}: ProductPickerProps) {
    return (
        <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-3 mb-2">
                Product
            </label>
            <input
                type="text"
                placeholder="Search by name or barcode…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 px-4 bg-canvas border border-border rounded-xl text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3"
            />
            <div className="mt-3 max-h-60 overflow-y-auto bg-canvas border border-border rounded-xl divide-y divide-border">
                {isLoading ? (
                    <div className="p-4 text-sm text-text-3">
                        Loading products…
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-4 text-sm text-text-3">
                        No products match your search.
                    </div>
                ) : (
                    <>
                        {products.map((p) => {
                            const isActive = selectedId === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => onSelect(p.id)}
                                    className={`w-full text-left px-4 py-3 transition-colors ${
                                        isActive
                                            ? 'bg-primary-soft'
                                            : 'hover:bg-surface-2'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-text-1">
                                                {p.name}
                                            </p>
                                            <p className="text-[11px] text-text-3 font-mono mt-0.5">
                                                {p.barcode}
                                            </p>
                                        </div>
                                        <span className="text-[11px] text-text-3">
                                            {p.category}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                        {remainingCount > 0 && (
                            <button
                                type="button"
                                onClick={onShowMore}
                                className="w-full text-center px-4 py-3 text-xs font-semibold text-primary hover:bg-surface-2 transition-colors"
                            >
                                Show{' '}
                                {Math.min(PAGE_SIZE_INCREMENT, remainingCount)}{' '}
                                more
                                <span className="text-text-3 font-normal">
                                    {' '}
                                    ({remainingCount} remaining)
                                </span>
                            </button>
                        )}
                    </>
                )}
            </div>
            {selectedProduct && (
                <p className="text-xs text-text-2 mt-2">
                    Selected:{' '}
                    <span className="text-text-1 font-medium">
                        {selectedProduct.name}
                    </span>
                </p>
            )}
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}
