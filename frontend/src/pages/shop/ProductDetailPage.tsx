import { Link } from 'react-router-dom';
import { ChevronLeft, Store } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useProductDetail } from '@/features/product-detail/hooks/useProductDetail';
import { ProductDetailImage } from '@/features/product-detail/components/ProductImage';
import { ProductDetailActions } from '@/features/product-detail/components/ProductDetailActions';

export function ProductDetailPage() {
    const p = useProductDetail();

    if (p.isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!p.product) {
        return (
            <div className="text-center py-24 text-text-3 text-sm">
                Product not found.
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link
                to={FRONTEND_ROUTES.SHOP}
                className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text-1 mb-6"
            >
                <ChevronLeft size={14} /> Back to catalog
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ProductDetailImage
                    src={p.product.imageUrl}
                    alt={p.product.name}
                />

                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-3">
                        {p.product.category}
                    </p>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight mt-2">
                        {p.product.name}
                    </h1>
                    <p className="text-3xl font-bold text-text-1 mt-4">
                        {formatCurrency(p.product.sellingPrice)}
                    </p>

                    {p.product.description && (
                        <p className="mt-4 text-sm text-text-2 leading-relaxed">
                            {p.product.description}
                        </p>
                    )}

                    {p.branchSwitchNeeded && p.targetBranch && (
                        <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-md bg-warning-soft border border-warning/40 text-xs text-warning">
                            <Store size={13} className="mt-0.5 flex-shrink-0" />
                            <span>
                                Available at <b>{p.targetBranch.name}</b>.
                                Adding will switch your cart to that branch.
                            </span>
                        </div>
                    )}

                    <ProductDetailActions
                        qty={p.qty}
                        onIncrement={p.increment}
                        onDecrement={p.decrement}
                        onAdd={p.handleAdd}
                        onBuyNow={p.handleBuyNow}
                        disabled={p.isOutEverywhere}
                    />
                </div>
            </div>
        </div>
    );
}
