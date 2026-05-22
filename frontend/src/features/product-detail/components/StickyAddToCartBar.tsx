import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface StickyAddToCartBarProps {
    name: string;
    sellingPrice: number;
    onAdd: () => void;
    disabled: boolean;
}

export function StickyAddToCartBar({
    name,
    sellingPrice,
    onAdd,
    disabled,
}: StickyAddToCartBarProps) {
    return (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-sticky bg-surface border-t border-border px-4 py-3 flex items-center gap-3 shadow-md-token">
            <div className="min-w-0 flex-1">
                <p className="text-xs text-text-3 truncate">{name}</p>
                <p className="text-sm font-bold text-text-1">
                    {formatCurrency(sellingPrice)}
                </p>
            </div>
            <button
                type="button"
                onClick={onAdd}
                disabled={disabled}
                className="inline-flex items-center gap-2 bg-primary text-text-inv font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ShoppingCart size={14} /> Add
            </button>
        </div>
    );
}
