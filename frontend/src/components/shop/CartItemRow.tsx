import { useDispatch } from 'react-redux';
import { Minus, Plus, Trash2 } from 'lucide-react';
import {
    removeFromCart,
    setQuantity,
    type ShopCartItem,
} from '@/store/slices/shopCartSlice';
import { formatCurrency } from '@/lib/utils';
import ProductImage from './ProductImage';

interface CartItemRowProps {
    item: ShopCartItem;
}

export default function CartItemRow({ item }: CartItemRowProps) {
    const dispatch = useDispatch();
    const lineTotal = item.sellingPrice * item.quantity;

    return (
        <li className="flex items-center gap-3 px-5 py-3">
            <ProductImage
                src={item.imageUrl}
                alt={item.name}
                wrapperClassName="w-14 h-14 bg-surface-2 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-1 line-clamp-2 leading-tight">
                    {item.name}
                </p>
                <p className="text-xs text-text-3 mt-1">
                    {formatCurrency(item.sellingPrice)} each
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <button
                        type="button"
                        onClick={() =>
                            dispatch(
                                setQuantity({
                                    productId: item.productId,
                                    quantity: item.quantity - 1,
                                }),
                            )
                        }
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="w-9 h-9 flex items-center justify-center rounded-md bg-surface-2 hover:bg-primary-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                    >
                        <Minus size={14} />
                    </button>
                    <span
                        className="text-sm font-semibold text-text-1 min-w-[2ch] text-center tabular-nums"
                        aria-live="polite"
                    >
                        {item.quantity}
                    </span>
                    <button
                        type="button"
                        onClick={() =>
                            dispatch(
                                setQuantity({
                                    productId: item.productId,
                                    quantity: item.quantity + 1,
                                }),
                            )
                        }
                        aria-label={`Increase quantity of ${item.name}`}
                        className="w-9 h-9 flex items-center justify-center rounded-md bg-surface-2 hover:bg-primary-soft transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                    >
                        <Plus size={14} />
                    </button>
                    <span className="ml-auto text-xs font-bold text-text-1 tabular-nums">
                        {formatCurrency(lineTotal)}
                    </span>
                </div>
            </div>
            <button
                type="button"
                onClick={() => dispatch(removeFromCart(item.productId))}
                className="p-2 rounded-md hover:bg-danger-soft text-text-3 hover:text-danger transition-colors self-start focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                aria-label={`Remove ${item.name} from cart`}
            >
                <Trash2 size={14} />
            </button>
        </li>
    );
}
