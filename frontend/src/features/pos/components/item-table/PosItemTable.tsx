import { useMemo, useState, type RefObject } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { ISearchProductRow, TPriceLevel } from '@/types';
import { usePosProductSearch } from '@/features/pos/hooks/usePosProductSearch';
import EmptyState from '@/components/ui/EmptyState';
import { PosPriceLevelToggle } from './PosPriceLevelToggle';
import { PosItemSearchInput } from './PosItemSearchInput';
import { PosItemSearchResults } from './PosItemSearchResults';
import { PosCartRow } from './PosCartRow';

interface IPosItemTableProps {
    cart: ICartItem[];
    addItem: (
        seed: Omit<
            ICartItem,
            | 'rowId'
            | 'lineSubtotal'
            | 'lineDiscountAmount'
            | 'lineTaxAmount'
            | 'lineTotal'
            | 'baseUnitQty'
        >,
    ) => void;
    updateItem: (rowId: string, patch: Partial<ICartItem>) => void;
    removeItem: (rowId: string) => void;
    priceLevel: TPriceLevel;
    setPriceLevel: (next: TPriceLevel) => void;
    /**
     * Optional external ref to the search input so the parent can fire
     * imperative focus (F2 shortcut, post-checkout refocus).
     */
    searchInputRef?: RefObject<HTMLInputElement | null>;
}

const HEADERS: { label: string; align?: 'left' | 'right' | 'center' }[] = [
    { label: 'Code', align: 'left' },
    { label: 'Description', align: 'left' },
    { label: 'Unit', align: 'left' },
    { label: 'Price', align: 'right' },
    { label: 'Disc %', align: 'left' },
    { label: 'Tax %', align: 'left' },
    { label: 'Qty', align: 'left' },
    { label: 'Free', align: 'left' },
    { label: 'Total', align: 'right' },
    { label: '', align: 'center' },
];

/**
 * Orchestrator for the cashier itemTable section. Owns the search query
 * state, wires `usePosProductSearch` to the debounced input, and turns a
 * picked search row into a fresh cart line via the parent's `addItem`.
 *
 * The dropdown's `onSelect` adds a row optimistically with `unitId = null`
 * and `conversionFactor = 1` (base unit assumed). The cashier can pick a
 * different sellable unit via the per-row dropdown; that call rewrites
 * `unitId`, `unitName`, and `conversionFactor` in one go.
 */
export function PosItemTable({
    cart,
    addItem,
    updateItem,
    removeItem,
    priceLevel,
    setPriceLevel,
    searchInputRef,
}: IPosItemTableProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    const searchQuery = usePosProductSearch(debouncedQuery);
    const results = useMemo(
        () => searchQuery.data ?? [],
        [searchQuery.data],
    );

    function handleSelect(row: ISearchProductRow) {
        const unitPrice =
            priceLevel === 'Retail' ? row.retailPrice : row.wholesalePrice;
        addItem({
            productId: row.productId,
            productCode: row.productCode,
            productName: row.productName,
            productType: row.productType,
            baseUnit: row.baseUnit,
            unitId: null,
            unitName: row.baseUnit,
            unitPrice,
            conversionFactor: 1,
            quantity: 1,
            free: 0,
            discountPercentage: 0,
            taxRate: row.taxRate,
            discountAllowed: row.discountAllowed,
        });
        setQuery('');
        setDebouncedQuery('');
    }

    const isDropdownOpen = query.trim().length > 0;

    return (
        <section
            aria-label="Cart items"
            className="bg-surface border border-border-strong rounded-md"
        >
            <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border-strong">
                <h2 className="text-sm font-semibold text-text-1">Items</h2>
                <PosPriceLevelToggle
                    value={priceLevel}
                    onChange={setPriceLevel}
                />
            </header>

            <div className="px-4 py-3 border-b border-border-strong">
                <div className="relative">
                    <PosItemSearchInput
                        value={query}
                        onChange={setQuery}
                        onDebouncedChange={setDebouncedQuery}
                        isSearching={searchQuery.isFetching}
                        inputRef={searchInputRef}
                    />
                    {isDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1">
                            <PosItemSearchResults
                                results={results}
                                priceLevel={priceLevel}
                                onSelect={handleSelect}
                                isLoading={searchQuery.isFetching}
                                query={debouncedQuery || query.trim()}
                            />
                        </div>
                    )}
                </div>
            </div>

            {cart.length === 0 ? (
                <EmptyState
                    icon={<ShoppingCart size={20} aria-hidden />}
                    title="No items yet"
                    description="Search a product to add it to the cart."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                        <thead>
                            <tr className="bg-surface-2 border-b border-border-strong">
                                {HEADERS.map((h, i) => (
                                    <th
                                        key={`${h.label}-${i}`}
                                        scope="col"
                                        className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-2 ${
                                            h.align === 'right'
                                                ? 'text-right'
                                                : h.align === 'center'
                                                  ? 'text-center'
                                                  : 'text-left'
                                        }`}
                                    >
                                        {h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item) => (
                                <PosCartRow
                                    key={item.rowId}
                                    item={item}
                                    onUpdate={updateItem}
                                    onRemove={removeItem}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
