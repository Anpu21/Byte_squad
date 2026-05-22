import { Link, Navigate } from 'react-router-dom';
import { X } from 'lucide-react';
import Pill from '@/components/ui/Pill';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useCatalogPage } from '@/features/shop-catalog/hooks/useCatalogPage';
import { CategoryChips } from '@/features/shop-catalog/components/CategoryChips';
import { ProductGrid } from '@/features/shop-catalog/components/ProductGrid';
import { NoBranchesCard } from '@/features/shop-catalog/components/NoBranchesCard';
import { RecommendedProductsSection } from '@/features/shop-catalog/components/RecommendedProductsSection';
import { BuyAgainSection } from '@/features/shop-catalog/components/BuyAgainSection';

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
                    . Change your pickup branch{' '}
                    <Link
                        to={FRONTEND_ROUTES.SHOP_PROFILE}
                        className="text-primary hover:underline font-medium"
                    >
                        in your profile
                    </Link>
                    .
                </p>
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

            <CategoryChips
                categories={p.categories}
                value={p.category}
                onChange={p.setCategory}
            />

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
