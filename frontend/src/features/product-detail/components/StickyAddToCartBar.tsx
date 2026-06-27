import { LuShoppingCart as ShoppingCart } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

interface StickyAddToCartBarProps {
    name: string;
    sellingPrice: number;
    unitLabel: string;
    onAdd: () => void;
    disabled: boolean;
}

export function StickyAddToCartBar({
    name,
    sellingPrice,
    unitLabel,
    onAdd,
    disabled,
}: StickyAddToCartBarProps) {
    return (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-sticky bg-surface border-t border-border px-4 py-3 flex items-center gap-4 shadow-md-token">
            <div className="min-w-0 flex-1">
                <p className="text-xs text-text-3 truncate">{name}</p>
                <p className="text-sm font-bold text-text-1 tabular-nums">
                    {formatCurrency(sellingPrice)}
                    <span className="text-text-3 font-medium"> / {unitLabel}</span>
                </p>
            </div>
            <Button
                type="button"
                variant="primary"
                onClick={onAdd}
                disabled={disabled}
            >
                <ShoppingCart size={14} /> Add
            </Button>
        </div>
    );
}
