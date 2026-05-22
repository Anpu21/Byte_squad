import { ShoppingCart } from 'lucide-react';
import { QtyStepper } from './QtyStepper';

interface ProductDetailActionsProps {
    qty: number;
    onIncrement: () => void;
    onDecrement: () => void;
    onAdd: () => void;
    onBuyNow: () => void;
    disabled: boolean;
}

export function ProductDetailActions({
    qty,
    onIncrement,
    onDecrement,
    onAdd,
    onBuyNow,
    disabled,
}: ProductDetailActionsProps) {
    return (
        <div className="mt-8 flex items-center gap-3 flex-wrap">
            <QtyStepper
                qty={qty}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
            />
            <button
                type="button"
                onClick={onAdd}
                disabled={disabled}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-surface border border-border-strong hover:bg-surface-2 text-text-1 font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ShoppingCart size={14} /> Add to cart
            </button>
            <button
                type="button"
                onClick={onBuyNow}
                disabled={disabled}
                className="flex-1 bg-primary text-text-inv font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Buy now
            </button>
        </div>
    );
}
