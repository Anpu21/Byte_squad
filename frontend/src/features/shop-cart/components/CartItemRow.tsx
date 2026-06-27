import { LuTrash2 as Trash2 } from 'react-icons/lu';
import { formatCurrency } from '@/lib/utils';
import { qtyRules } from '@/lib/unit-quantity';
import { QuantityField } from '@/components/shop/QuantityField';
import ProductImage from '@/components/shop/ProductImage';
import type {
    ShopCartItem,
    ShopCartLineRef,
} from '@/store/slices/shopCartSlice';

interface CartItemRowProps {
    item: ShopCartItem;
    onChangeQty: (ref: ShopCartLineRef, quantity: number) => void;
    onRemove: (ref: ShopCartLineRef) => void;
}

export function CartItemRow({ item, onChangeQty, onRemove }: CartItemRowProps) {
    const lineRef: ShopCartLineRef = {
        productId: item.productId,
        branchId: item.branchId,
        unitId: item.unitId,
    };
    // Legacy persisted lines predate `baseUnit`; fall back to the unit label.
    const rules = qtyRules(item.baseUnit || item.unitLabel);

    return (
        <div className="flex items-center gap-4 p-5 border-b border-border last:border-0">
            <ProductImage
                src={item.imageUrl}
                alt={item.name}
                wrapperClassName="w-16 h-16 aspect-square bg-canvas rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                imgClassName="w-full h-full object-cover"
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-1 line-clamp-1">
                    {item.name}
                </p>
                <p className="text-xs text-text-3 mt-1 tabular-nums">
                    {formatCurrency(item.sellingPrice)} / {item.unitLabel}
                </p>
            </div>
            <QuantityField
                value={item.quantity}
                onChange={(quantity) => onChangeQty(lineRef, quantity)}
                step={rules.step}
                min={rules.min}
                decimals={rules.decimals}
                unitLabel={item.unitLabel}
                ariaLabel={`Quantity of ${item.name}`}
            />
            <p className="text-sm font-bold text-text-1 min-w-[80px] text-right tabular-nums">
                {formatCurrency(item.sellingPrice * item.quantity)}
            </p>
            <button
                type="button"
                onClick={() => onRemove(lineRef)}
                className="p-1.5 rounded-lg hover:bg-danger-soft text-text-3 hover:text-danger transition-colors"
                aria-label="Remove"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
