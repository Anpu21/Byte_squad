import type { ISearchProductRow } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';

interface IPosItemSearchResultsProps {
    results: ISearchProductRow[];
    onSelect: (row: ISearchProductRow) => void;
    isLoading?: boolean;
    /** The query the cashier last typed; surfaces in the empty/no-result hint. */
    query?: string;
    className?: string;
}

/**
 * Dropdown of typeahead results below the search input. Renders one row per
 * matching product with code, name, and the retail price. Pricing collapsed
 * to a single tier after the Retail/Wholesale toggle was removed.
 *
 * No keyboard navigation here — the parent's `PosItemSearchInput` owns the
 * focus, and the cashier picks with the mouse (or via a barcode hit).
 */
export function PosItemSearchResults({
    results,
    onSelect,
    isLoading = false,
    query,
    className,
}: IPosItemSearchResultsProps) {
    const hasQuery = (query ?? '').trim().length > 0;

    if (!hasQuery) return null;

    if (isLoading) {
        return (
            <div
                role="status"
                aria-live="polite"
                className={cn(
                    'bg-surface border border-border rounded-md shadow-md-token z-dropdown px-4 py-6 text-center text-xs text-text-3',
                    className,
                )}
            >
                Searching products
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div
                role="status"
                className={cn(
                    'bg-surface border border-border rounded-md shadow-md-token z-dropdown px-4 py-6 text-center text-xs text-text-3',
                    className,
                )}
            >
                No products match {query ? `"${query}"` : 'that search'}.
            </div>
        );
    }

    return (
        <ul
            role="listbox"
            aria-label="Product suggestions"
            className={cn(
                'bg-surface border border-border rounded-md shadow-md-token z-dropdown overflow-hidden max-h-[320px] overflow-y-auto',
                className,
            )}
        >
            {results.map((row) => (
                <li key={row.productId} role="option" aria-selected={false}>
                    <button
                        type="button"
                        onClick={() => onSelect(row)}
                        className="w-full grid grid-cols-[1fr_auto] gap-3 px-3 py-2.5 text-left hover:bg-surface-2 focus:bg-surface-2 focus:outline-none transition-colors"
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-text-1 truncate">
                                {row.productName}
                            </p>
                            <p className="mt-0.5 text-[11px] text-text-3 truncate">
                                <span className="font-mono">{row.productCode}</span>
                                <span className="mx-1.5">·</span>
                                <span>{row.baseUnit}</span>
                                {row.taxRate > 0 && (
                                    <>
                                        <span className="mx-1.5">·</span>
                                        <span>tax {row.taxRate}%</span>
                                    </>
                                )}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-text-1">
                                {formatCurrency(row.retailPrice)}
                            </p>
                        </div>
                    </button>
                </li>
            ))}
        </ul>
    );
}
