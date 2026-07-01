import type { IProduct } from '@/types';

interface TransferProductSuggestionsProps {
    results: { product: IProduct; quantity: number }[];
    activeIdx: number;
    isFetching: boolean;
    query: string;
    onHover: (idx: number) => void;
    onPick: (product: IProduct) => void;
}

/** Floating product result list under the transfer "add product" search box. */
export function TransferProductSuggestions({
    results,
    activeIdx,
    isFetching,
    query,
    onHover,
    onPick,
}: TransferProductSuggestionsProps) {
    return (
        <div
            role="listbox"
            aria-label="Product suggestions"
            className="absolute left-0 right-0 bottom-full mb-1 z-dropdown bg-surface border border-border rounded-md shadow-md-token min-w-[280px] max-h-[260px] overflow-y-auto"
        >
            {results.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-text-3 text-center">
                    {isFetching
                        ? 'Searching…'
                        : `No products found for "${query}"`}
                </div>
            ) : (
                results.map((row, idx) => {
                    const active = idx === activeIdx;
                    return (
                        <button
                            type="button"
                            key={row.product.id}
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => onHover(idx)}
                            onClick={() => onPick(row.product)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors focus:outline-none ${
                                active ? 'bg-primary-soft' : 'hover:bg-surface-2'
                            }`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-text-1 truncate">
                                    {row.product.name}
                                </p>
                                <p className="text-[11px] text-text-3 mono truncate">
                                    {row.product.barcode ||
                                        row.product.id.slice(0, 12)}
                                </p>
                            </div>
                            <span className="text-[11px] text-text-2 mono flex-shrink-0 tabular-nums">
                                {row.quantity} in stock
                            </span>
                        </button>
                    );
                })
            )}
        </div>
    );
}
