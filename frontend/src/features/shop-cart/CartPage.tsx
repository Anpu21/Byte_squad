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
import { CartSummaryCard } from '@/features/shop-cart/components/CartSummaryCard';
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

    const itemCount = groups.reduce((n, g) => n + g.items.length, 0);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-1 tracking-tight">
                    Your cart
                </h1>
                <p className="text-sm text-text-2 mt-1.5">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} · pickup at
                    your selected branch{groups.length > 1 ? 'es' : ''}.
                </p>
            </div>

            <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-7 lg:items-start">
                <div className="space-y-5">
                    {groups.map((group) => (
                        <div
                            key={group.branchId}
                            className="bg-surface border border-border rounded-2xl shadow-sm-token overflow-hidden"
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
                                    key={`${item.productId}:${item.branchId}:${item.unitId ?? 'base'}:${item.amount != null ? 'amt' : 'wt'}`}
                                    item={item}
                                    onChangeQty={handleChangeQty}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                <CartSummaryCard
                    className="mt-5 lg:mt-0 lg:sticky lg:top-[88px]"
                    total={total}
                    itemCount={itemCount}
                    branchCount={groups.length}
                    onCheckout={() => navigate(FRONTEND_ROUTES.SHOP_CHECKOUT)}
                />
            </div>
        </div>
    );
}
