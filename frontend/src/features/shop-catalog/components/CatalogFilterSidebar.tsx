import { useState, type ReactNode } from 'react';
import {
    LuSearch as Search,
    LuSlidersHorizontal as Sliders,
    LuChevronDown as ChevronDown,
    LuStore as Store,
} from 'react-icons/lu';
import { Select } from '@/components/ui/Select';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import type { IShopBranch, ShopStockStatus } from '@/types';
import { STOCK_LABEL } from '../lib/stock-style';
import type { CatalogSort } from '../hooks/useCatalogPage';

const SORT_OPTIONS: { label: string; value: CatalogSort }[] = [
    { label: 'Name (A–Z)', value: 'name' },
    { label: 'Price: Low → High', value: 'price_asc' },
    { label: 'Price: High → Low', value: 'price_desc' },
];

const STOCK_ORDER: ShopStockStatus[] = ['in', 'low', 'out'];

interface CatalogFilterSidebarProps {
    search: string;
    onSearch: (value: string) => void;
    categories: string[];
    category: string;
    onCategory: (value: string) => void;
    stock: ShopStockStatus[];
    stockCounts: Record<ShopStockStatus, number>;
    onToggleStock: (value: ShopStockStatus) => void;
    maxPrice: number | null;
    priceCeiling: number;
    onMaxPrice: (value: number | null) => void;
    branches: IShopBranch[];
    activeBranchId: string | null;
    onBranch: (id: string) => void;
    sort: CatalogSort;
    onSort: (value: CatalogSort) => void;
    onClear: () => void;
    hasActiveFilters: boolean;
    className?: string;
}

function Section({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-3">
                {label}
            </p>
            {children}
        </div>
    );
}

export function CatalogFilterSidebar({
    search,
    onSearch,
    categories,
    category,
    onCategory,
    stock,
    stockCounts,
    onToggleStock,
    maxPrice,
    priceCeiling,
    onMaxPrice,
    branches,
    activeBranchId,
    onBranch,
    sort,
    onSort,
    onClear,
    hasActiveFilters,
    className,
}: CatalogFilterSidebarProps) {
    const [open, setOpen] = useState(false);
    const categoryOptions = [{ label: 'All categories', value: '' }, ...categories.map((c) => ({ label: c, value: c }))];
    const sliderValue = maxPrice ?? priceCeiling;

    return (
        <aside
            className={cn(
                'rounded-2xl border border-border bg-surface p-5 shadow-sm-token',
                className,
            )}
        >
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="flex w-full items-center justify-between lg:hidden"
            >
                <span className="flex items-center gap-2 text-[15px] font-semibold text-text-1">
                    <Sliders size={16} className="text-text-2" /> Filters
                    {hasActiveFilters && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                </span>
                <ChevronDown
                    size={18}
                    className={cn(
                        'text-text-3 transition-transform',
                        open && 'rotate-180',
                    )}
                />
            </button>

            <div
                className={cn(
                    'flex-col gap-6',
                    open ? 'flex mt-5 lg:mt-0' : 'hidden lg:flex',
                )}
            >
                <div className="relative flex items-center">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3 text-text-3"
                    />
                    <input
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Filter products"
                        aria-label="Filter products"
                        className={`${FIELD_SHELL} ${FIELD_BORDER} w-full py-2.5 pl-9 pr-3`}
                    />
                </div>

                <Section label="Category">
                    <Select
                        aria-label="Filter by category"
                        value={category}
                        onChange={onCategory}
                        options={categoryOptions}
                        className="w-full"
                    />
                </Section>

                <Section label="Availability">
                    <div className="flex flex-col gap-1">
                        {STOCK_ORDER.map((s) => {
                            const checked = stock.includes(s);
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => onToggleStock(s)}
                                    role="checkbox"
                                    aria-checked={checked}
                                    className="flex items-center gap-2.5 py-1 text-left"
                                >
                                    <span
                                        className={cn(
                                            'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                                            checked
                                                ? 'border-primary bg-primary text-text-inv'
                                                : 'border-border-strong bg-surface',
                                        )}
                                    >
                                        {checked && (
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="M20 6 9 17l-5-5" />
                                            </svg>
                                        )}
                                    </span>
                                    <span className="flex-1 text-[13px] font-medium text-text-2">
                                        {STOCK_LABEL[s]}
                                    </span>
                                    <span className="text-xs text-text-3 tabular-nums">
                                        {stockCounts[s]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Section>

                {priceCeiling > 0 && (
                    <Section label="Max price">
                        <input
                            type="range"
                            min={0}
                            max={priceCeiling}
                            step={50}
                            value={sliderValue}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                onMaxPrice(v >= priceCeiling ? null : v);
                            }}
                            aria-label="Maximum price"
                            className="w-full cursor-pointer accent-primary"
                        />
                        <p className="mt-2 text-[13px] font-medium text-text-2">
                            Up to{' '}
                            <span className="font-semibold text-text-1">
                                {formatCurrency(sliderValue)}
                            </span>
                        </p>
                    </Section>
                )}

                {branches.length > 0 && (
                    <Section label="Shopping at">
                        <Select
                            aria-label="Choose which branch to shop"
                            value={activeBranchId ?? ''}
                            onChange={onBranch}
                            options={branches.map((b) => ({
                                label: b.name,
                                value: b.id,
                            }))}
                            className="w-full"
                        />
                    </Section>
                )}

                <Section label="Sort by">
                    <Select
                        aria-label="Sort products"
                        value={sort}
                        onChange={(v) => onSort(v as CatalogSort)}
                        options={SORT_OPTIONS}
                        className="w-full"
                    />
                </Section>

                <button
                    type="button"
                    onClick={onClear}
                    disabled={!hasActiveFilters}
                    className="rounded-lg border border-border bg-surface-2 py-2.5 text-[13px] font-semibold text-text-2 transition-colors hover:bg-surface-hover hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Clear all filters
                </button>

                <p className="hidden items-center gap-1.5 text-[11px] text-text-3 lg:flex">
                    <Store size={12} /> Cart can mix branches
                </p>
            </div>
        </aside>
    );
}
