import type { IShopProduct } from '@/types';
import { ProductCard } from './ProductCard';

interface RecommendedProductsSectionProps {
    title: string;
    products: IShopProduct[];
    onAdd: (product: IShopProduct) => void;
    onBranchSelect: (branchId: string) => void;
}

export function RecommendedProductsSection({
    title,
    products,
    onAdd,
    onBranchSelect,
}: RecommendedProductsSectionProps) {
    if (products.length === 0) return null;

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-3">
                <h2 className="text-base font-semibold text-text-1">
                    {title}
                </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={onAdd}
                        onBranchSelect={onBranchSelect}
                    />
                ))}
            </div>
        </section>
    );
}
