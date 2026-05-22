import { ShoppingBag } from 'lucide-react';
import type { IShopProduct } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
    products: IShopProduct[];
    isLoading: boolean;
    onAdd: (product: IShopProduct) => void;
    onBranchSelect: (branchId: string) => void;
}

export function ProductGrid({
    products,
    isLoading,
    onAdd,
    onBranchSelect,
}: ProductGridProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
                    <ShoppingBag size={20} className="text-text-2" />
                </div>
                <p className="text-sm font-semibold text-text-1">
                    No products found
                </p>
                <p className="text-xs text-text-3 mt-1">
                    Try a different search or category at this branch.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={onAdd}
                    onBranchSelect={onBranchSelect}
                />
            ))}
        </div>
    );
}
