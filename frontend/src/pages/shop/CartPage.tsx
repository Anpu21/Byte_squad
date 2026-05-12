import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
    removeFromCart,
    setQuantity,
    selectCartTotal,
} from '@/store/slices/shopCartSlice';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { CartItemRow } from '@/features/shop-cart/components/CartItemRow';
import { CartTotalBar } from '@/features/shop-cart/components/CartTotalBar';
import { EmptyCart } from '@/features/shop-cart/components/EmptyCart';

export function CartPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const items = useSelector((state: RootState) => state.shopCart.items);
    const total = selectCartTotal(items);

    if (items.length === 0) return <EmptyCart />;

    const handleChangeQty = (productId: string, quantity: number) => {
        dispatch(setQuantity({ productId, quantity }));
    };

    const handleRemove = (productId: string) => {
        dispatch(removeFromCart(productId));
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-text-1 tracking-tight mb-8">
                Cart
            </h1>

            <div className="bg-surface border border-border rounded-md overflow-hidden">
                {items.map((item) => (
                    <CartItemRow
                        key={item.productId}
                        item={item}
                        onChangeQty={handleChangeQty}
                        onRemove={handleRemove}
                    />
                ))}
            </div>

            <CartTotalBar
                total={total}
                onCheckout={() => navigate(FRONTEND_ROUTES.SHOP_CHECKOUT)}
            />
        </div>
    );
}
