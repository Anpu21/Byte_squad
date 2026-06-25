import { LuShoppingCart as ShoppingCart } from 'react-icons/lu';
import Button from '@/components/ui/Button';
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
