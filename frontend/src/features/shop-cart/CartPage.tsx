import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    removeFromCart,
    setQuantity,
    type ShopCartLineRef,
} from '@/store/slices/shopCartSlice';
import {
    selectShopCartGroups,
    selectShopCartTotal,
} from '@/store/selectors/shopCart';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';
import { CartItemRow } from '@/features/shop-cart/components/CartItemRow';
import { CartTotalBar } from '@/features/shop-cart/components/CartTotalBar';
import { EmptyCart } from '@/features/shop-cart/components/EmptyCart';

export function CartPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const groups = useAppSelector(selectShopCartGroups);
    const total = useAppSelector(selectShopCartTotal);

    if (groups.length === 0) return <EmptyCart />;

    const handleChangeQty = (ref: ShopCartLineRef, quantity: number) => {
        dispatch(setQuantity({ ...ref, quantity }));
    };

    const handleRemove = (ref: ShopCartLineRef) => {
        dispatch(removeFromCart(ref));
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-text-1 tracking-tight mb-8">
                Cart
            </h1>

            <div className="space-y-5">
                {groups.map((group) => (
                    <div
                        key={group.branchId}
                        className="bg-surface border border-border rounded-xl shadow-sm-token overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-2">
                                Pickup at {group.branchName || 'branch'}
                            </span>
                            <span className="text-xs font-semibold text-text-1 tabular-nums">
                                {formatCurrency(group.subtotal)}
                            </span>
                        </div>
                        {group.items.map((item) => (
                            <CartItemRow
                                key={`${item.productId}:${item.branchId}:${item.unitId ?? 'base'}`}
                                item={item}
                                onChangeQty={handleChangeQty}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>
                ))}
            </div>

            <CartTotalBar
                total={total}
                onCheckout={() => navigate(FRONTEND_ROUTES.SHOP_CHECKOUT)}
            />
        </div>
    );
}
