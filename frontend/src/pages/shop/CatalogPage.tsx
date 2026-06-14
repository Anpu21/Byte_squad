import { X } from 'lucide-react';
import Pill from '@/components/ui/Pill';
import { Select } from '@/components/ui/Select';
import { useCatalogPage } from '@/features/shop-catalog/hooks/useCatalogPage';
import type { CatalogSort } from '@/features/shop-catalog/hooks/useCatalogPage';
import { BranchSwitcher } from '@/features/shop-catalog/components/BranchSwitcher';
import { ProductGrid } from '@/features/shop-catalog/components/ProductGrid';
import { NoBranchesCard } from '@/features/shop-catalog/components/NoBranchesCard';
import { RecommendedProductsSection } from '@/features/shop-catalog/components/RecommendedProductsSection';
import { BuyAgainSection } from '@/features/shop-catalog/components/BuyAgainSection';

const SORT_OPTIONS = [
    { label: 'Sort: Name (A–Z)', value: 'name' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
];

export function CatalogPage() {
    const p = useCatalogPage();

    if (!p.branchesLoading && p.branches.length === 0) {
        return <NoBranchesCard />;
    }

    if (!p.branchId) {
        return (
            <div className="py-20 text-center text-sm text-text-3">
                Loading branches…
            </div>
        );
    }

    const categoryOptions = [
        { label: 'All categories', value: '' },
        ...p.categories.map((c) => ({ label: c, value: c })),
    ];

    return (
        <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Browse products
                    </h1>
                    <p className="text-sm text-text-2 mt-1">
                        Add items from any branch — your cart can mix branches.
                    </p>
                </div>
                <BranchSwitcher
                    branches={p.branches}
                    activeBranchId={p.activeBranchId}
                    onChange={p.handleBranchChange}
                />
            </div>

            {p.search && (
                <div className="mb-4">
                    <Pill tone="primary" dot={false}>
                        Search: “{p.search}”
                        <button
                            type="button"
                            onClick={p.clearSearch}
                            aria-label="Clear search"
                            className="ml-1.5 -mr-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-soft/60 focus:outline-none focus:ring-[2px] focus:ring-primary/30"
                        >
                            <X size={10} />
                        </button>
                    </Pill>
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <Select
                    aria-label="Filter by category"
                    value={p.category}
                    onChange={p.setCategory}
                    options={categoryOptions}
                    className="min-w-[11rem]"
                />
                <Select
                    aria-label="Sort products"
                    value={p.sort}
                    onChange={(v) => p.setSort(v as CatalogSort)}
                    options={SORT_OPTIONS}
                    className="min-w-[11rem]"
                />
            </div>

            {!p.search && !p.category && (
                <>
                    <BuyAgainSection
                        products={p.buyAgainProducts}
                        onAdd={p.handleAdd}
                        onBranchSelect={p.handleBranchChange}
                    />
                    <RecommendedProductsSection
                        title="Recommended for you"
                        products={p.recommendedProducts}
                        onAdd={p.handleAdd}
                        onBranchSelect={p.handleBranchChange}
                    />
                </>
            )}

            <ProductGrid
                products={p.products}
                isLoading={p.isLoading}
                onAdd={p.handleAdd}
                onBranchSelect={p.handleBranchChange}
            />
        </div>
    );
}
