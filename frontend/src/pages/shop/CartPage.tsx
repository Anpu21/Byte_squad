import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Minus, Plus } from 'lucide-react';
import type { RootState } from '@/store';
import {
    removeFromCart,
    setQuantity,
    selectCartTotal,
} from '@/store/slices/shopCartSlice';
import { FRONTEND_ROUTES } from '@/constants/routes';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

export default function CartPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const items = useSelector((state: RootState) => state.shopCart.items);
    const total = selectCartTotal(items);

    if (items.length === 0) {
        return (
            <div className="max-w-2xl mx-auto text-center py-24">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight mb-3">
                    Your cart is empty
                </h1>
                <p className="text-sm text-text-2 mb-6">
                    Add some products to get started.
                </p>
                <Link
                    to={FRONTEND_ROUTES.SHOP}
                    className="inline-block px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                >
                    Browse products
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-text-1 tracking-tight mb-8">
                Cart
            </h1>

            <div className="bg-[#111] border border-border rounded-md overflow-hidden">
                {items.map((item) => (
                    <div
                        key={item.productId}
                        className="flex items-center gap-4 p-4 border-b border-border last:border-0"
                    >
                        <div className="w-16 h-16 bg-canvas rounded-lg overflow-hidden flex items-center justify-center">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-text-3 text-[10px]">No image</span>
                            )}
                        </div>
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
                                    dispatch(
                                        setQuantity({
                                            productId: item.productId,
                                            quantity: item.quantity - 1,
                                        }),
                                    )
                                }
                                disabled={item.quantity <= 1}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-primary-soft disabled:opacity-30"
                            >
                                <Minus size={12} />
                            </button>
                            <span className="text-sm font-semibold text-text-1 min-w-[2ch] text-center">
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
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-2 hover:bg-primary-soft"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                        <p className="text-sm font-bold text-text-1 min-w-[80px] text-right">
                            {formatCurrency(item.sellingPrice * item.quantity)}
                        </p>
                        <button
                            type="button"
                            onClick={() => dispatch(removeFromCart(item.productId))}
                            className="p-1.5 rounded-lg hover:bg-danger-soft text-text-3 hover:text-danger transition-colors"
                            aria-label="Remove"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between bg-[#111] border border-border rounded-md p-5">
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-3">
                        Estimated total
                    </p>
                    <p className="text-2xl font-bold text-text-1 tracking-tight mt-1">
                        {formatCurrency(total)}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(FRONTEND_ROUTES.SHOP_CHECKOUT)}
                    className="px-5 py-2.5 bg-primary text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                >
                    Checkout →
                </button>
            </div>
        </div>
    );
}
