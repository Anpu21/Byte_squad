import { useAppDispatch } from '@/store/hooks';
import { LuTrash2 as Trash2 } from 'react-icons/lu';
import {
    removeFromCart,
    setQuantity,
    type ShopCartItem,
} from '@/store/slices/shopCartSlice';
import { formatCurrency } from '@/lib/utils';
import { qtyRules } from '@/lib/unit-quantity';
import { QuantityField } from '@/components/shop/QuantityField';
import ProductImage from './ProductImage';

interface CartItemRowProps {
    item: ShopCartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
    const dispatch = useAppDispatch();
    const lineRef = {
        productId: item.productId,
        branchId: item.branchId,
        unitId: item.unitId,
    };
    // Legacy persisted lines predate `baseUnit`; fall back to the unit label.
    const rules = qtyRules(item.baseUnit || item.unitLabel);
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
                    {formatCurrency(item.sellingPrice)} / {item.unitLabel}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <QuantityField
                        value={item.quantity}
                        onChange={(quantity) =>
                            dispatch(setQuantity({ ...lineRef, quantity }))
                        }
                        step={rules.step}
                        min={rules.min}
                        decimals={rules.decimals}
                        unitLabel={item.unitLabel}
                        ariaLabel={`Quantity of ${item.name}`}
                    />
                    <span className="ml-auto text-xs font-bold text-text-1 tabular-nums">
                        {formatCurrency(lineTotal)}
                    </span>
                </div>
            </div>
            <button
                type="button"
                onClick={() => dispatch(removeFromCart(lineRef))}
                className="p-2 rounded-md hover:bg-danger-soft text-text-3 hover:text-danger transition-colors self-start focus:outline-none focus:ring-[3px] focus:ring-focus/25"
                aria-label={`Remove ${item.name} from cart`}
            >
                <Trash2 size={14} />
            </button>
        </li>
    );
}
