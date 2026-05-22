import { RotateCcw } from 'lucide-react';
import type { IShopProduct } from '@/types';
import { ProductCard } from './ProductCard';

interface BuyAgainSectionProps {
    products: IShopProduct[];
    onAdd: (product: IShopProduct) => void;
    onBranchSelect: (branchId: string) => void;
}

export function BuyAgainSection({
    products,
    onAdd,
    onBranchSelect,
}: BuyAgainSectionProps) {
    if (products.length === 0) return null;

    return (
        <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
                <RotateCcw
                    size={16}
                    className="text-text-2"
                    aria-hidden="true"
                />
                <h2 className="text-base font-semibold text-text-1">
                    Buy it again
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
