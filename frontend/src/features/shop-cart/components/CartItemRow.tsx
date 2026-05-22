import { Trash2, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ProductImage from '@/components/shop/ProductImage';

interface CartItem {
    productId: string;
    name: string;
    sellingPrice: number;
    quantity: number;
    imageUrl?: string | null;
}

interface CartItemRowProps {
    item: CartItem;
    onChangeQty: (productId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
}

export function CartItemRow({ item, onChangeQty, onRemove }: CartItemRowProps) {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-border last:border-0">
            <ProductImage src={item.imageUrl} alt={item.name} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-1 line-clamp-1">
                    {item.name}
                </p>
                <p className="text-xs text-text-3 mt-1">
                    {formatCurrency(item.sellingPrice)} each
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() =>
                        onChangeQty(item.productId, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                    aria-label={`Decrease quantity of ${item.name}`}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-primary-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Minus size={14} />
                </button>
                <span
                    className="text-sm font-semibold text-text-1 min-w-[2ch] text-center"
                    aria-live="polite"
                >
                    {item.quantity}
                </span>
                <button
                    type="button"
                    onClick={() =>
                        onChangeQty(item.productId, item.quantity + 1)
                    }
                    aria-label={`Increase quantity of ${item.name}`}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-primary-soft transition-colors"
                >
                    <Plus size={14} />
                </button>
            </div>
            <p className="text-sm font-bold text-text-1 min-w-[80px] text-right">
                {formatCurrency(item.sellingPrice * item.quantity)}
            </p>
            <button
                type="button"
                onClick={() => onRemove(item.productId)}
                className="p-1.5 rounded-lg hover:bg-danger-soft text-text-3 hover:text-danger transition-colors"
                aria-label="Remove"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
