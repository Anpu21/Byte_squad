import { Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useCatalogPage } from '@/features/shop-catalog/hooks/useCatalogPage';
import { CatalogFilters } from '@/features/shop-catalog/components/CatalogFilters';
import { ProductGrid } from '@/features/shop-catalog/components/ProductGrid';
import { NoBranchesCard } from '@/features/shop-catalog/components/NoBranchesCard';
import { RecommendedProductsSection } from '@/features/shop-catalog/components/RecommendedProductsSection';

export function CatalogPage() {
    const p = useCatalogPage();

    if (!p.branchId) {
        return <Navigate to={FRONTEND_ROUTES.SELECT_BRANCH} replace />;
    }

    if (!p.branchesLoading && p.branches.length === 0) {
        return <NoBranchesCard />;
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Browse products
                </h1>
                <p className="text-sm text-text-2 mt-1">
                    Showing items at{' '}
                    <span className="text-text-1 font-medium">
                        {p.currentBranch?.name ?? '…'}
                    </span>
                    . Switch any time.
                </p>
            </div>

            <CatalogFilters
                branches={p.branches}
                branchId={p.branchId}
                onBranchChange={p.handleBranchChange}
                search={p.search}
                setSearch={p.setSearch}
                category={p.category}
                setCategory={p.setCategory}
                categories={p.categories}
            />

            {!p.search && !p.category && (
                <RecommendedProductsSection
                    title="Recommended for you"
                    products={p.recommendedProducts}
                    onAdd={p.handleAdd}
                    onBranchSelect={p.handleBranchChange}
                />
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
