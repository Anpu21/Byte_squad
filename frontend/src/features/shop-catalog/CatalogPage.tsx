import { LuStore as Store } from 'react-icons/lu';
import { useCatalogPage } from '@/features/shop-catalog/hooks/useCatalogPage';
import { CatalogFilterSidebar } from '@/features/shop-catalog/components/CatalogFilterSidebar';
import { ProductGrid } from '@/features/shop-catalog/components/ProductGrid';
import { NoBranchesCard } from '@/features/shop-catalog/components/NoBranchesCard';
import { RecommendedProductsSection } from '@/features/shop-catalog/components/RecommendedProductsSection';
import { BuyAgainSection } from '@/features/shop-catalog/components/BuyAgainSection';

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

    return (
        <div>
            <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-1 tracking-tight">
                    Browse products
                </h1>
                <p className="text-sm text-text-2 mt-1.5">
                    Add items from any branch — your cart can mix branches.
                </p>
            </div>

            <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-7 lg:items-start">
                <CatalogFilterSidebar
                    className="mb-5 lg:mb-0 lg:sticky lg:top-[88px]"
                    search={p.search}
                    onSearch={p.setSearch}
                    categories={p.categories}
                    category={p.category}
                    onCategory={p.setCategory}
                    stock={p.stock}
                    stockCounts={p.stockCounts}
                    onToggleStock={p.toggleStock}
                    branches={p.branches}
                    activeBranchId={p.activeBranchId}
                    onBranch={p.handleBranchChange}
                    onClear={p.clearFilters}
                    hasActiveFilters={p.hasActiveFilters}
                />

                <div className="min-w-0">
                    <div className="sticky top-16 z-sticky -mx-1 mb-4 flex items-center justify-between gap-3 bg-canvas px-1 py-3">
                        <span className="text-sm font-medium text-text-2">
                            {p.productCount}{' '}
                            {p.productCount === 1 ? 'product' : 'products'}
                        </span>
                        {p.currentBranch && (
                            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-2">
                                <Store size={14} className="text-text-3" />
                                {p.currentBranch.name}
                            </span>
                        )}
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
                        products={p.visibleProducts}
                        isLoading={p.isLoading}
                        onAdd={p.handleAdd}
                        onBranchSelect={p.handleBranchChange}
                    />
                </div>
            </div>
        </div>
    );
}
