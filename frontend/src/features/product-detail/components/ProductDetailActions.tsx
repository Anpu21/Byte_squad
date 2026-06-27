import { LuShoppingCart as ShoppingCart } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import { QuantityField } from '@/components/shop/QuantityField';

interface ProductDetailActionsProps {
    qty: number;
    onQtyChange: (next: number) => void;
    step: number;
    min: number;
    decimals: number;
    unitLabel: string;
    onAdd: () => void;
    onBuyNow: () => void;
    disabled: boolean;
}

export function ProductDetailActions({
    qty,
    onQtyChange,
    step,
    min,
    decimals,
    unitLabel,
    onAdd,
    onBuyNow,
    disabled,
}: ProductDetailActionsProps) {
    return (
        <div className="mt-8 flex items-center gap-3 flex-wrap">
            <QuantityField
                value={qty}
                onChange={onQtyChange}
                step={step}
                min={min}
                decimals={decimals}
                unitLabel={unitLabel}
                disabled={disabled}
                ariaLabel="Quantity"
            />
            <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={onAdd}
                disabled={disabled}
                className="flex-1"
            >
                <ShoppingCart size={14} /> Add to cart
            </Button>
            <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={onBuyNow}
                disabled={disabled}
                className="flex-1"
            >
                Buy now
            </Button>
        </div>
    );
}
