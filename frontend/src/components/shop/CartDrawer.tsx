import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { X, Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import type { RootState } from '@/store';
import {
    closeCartDrawer,
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

export default function CartDrawer() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const items = useSelector((state: RootState) => state.shopCart.items);
    const isOpen = useSelector((state: RootState) => state.shopCart.isCartOpen);
    const total = selectCartTotal(items);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') dispatch(closeCartDrawer());
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, dispatch]);

    const close = () => dispatch(closeCartDrawer());
    const goToCart = () => {
        close();
        navigate(FRONTEND_ROUTES.SHOP_CART);
    };
    const goToCheckout = () => {
        close();
        navigate(FRONTEND_ROUTES.SHOP_CHECKOUT);
    };

    return (
        <>
            <div
                onClick={close}
                aria-hidden={!isOpen}
                style={{ background: 'var(--overlay)' }}
                className={`fixed inset-0 z-30 transition-opacity ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            />
            <aside
                aria-label="Shopping cart"
                className={`fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-canvas border-l border-border z-40 flex flex-col transform transition-transform duration-300 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <header className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2 text-text-1">
                        <ShoppingCart size={16} />
                        <h2 className="font-semibold tracking-tight">Your cart</h2>
                        <span className="text-xs text-text-3">
                            ({items.length} {items.length === 1 ? 'item' : 'items'})
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        className="p-1.5 rounded-lg hover:bg-surface-2 text-text-2 hover:text-text-1"
                        aria-label="Close cart"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
                                <ShoppingCart size={20} className="text-text-2" />
                            </div>
                            <p className="text-sm text-text-2">
                                Your cart is empty.
                            </p>
                            <p className="text-xs text-text-3 mt-1">
                                Add products from the catalog to get started.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {items.map((item) => (
                                <li
                                    key={item.productId}
                                    className="flex items-center gap-3 px-5 py-3"
                                >
                                    <div className="w-14 h-14 bg-[#111] rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-text-3 text-[10px]">
                                                No image
                                            </span>
                                        )}
                                    </div>
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
                                                className="w-6 h-6 flex items-center justify-center rounded bg-surface-2 hover:bg-primary-soft disabled:opacity-30"
                                            >
                                                <Minus size={11} />
                                            </button>
                                            <span className="text-xs font-semibold text-text-1 min-w-[1.5ch] text-center">
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
                                                className="w-6 h-6 flex items-center justify-center rounded bg-surface-2 hover:bg-primary-soft"
                                            >
                                                <Plus size={11} />
                                            </button>
                                            <span className="ml-auto text-xs font-bold text-text-1">
                                                {formatCurrency(
                                                    item.sellingPrice * item.quantity,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            dispatch(removeFromCart(item.productId))
                                        }
                                        className="p-1.5 rounded-lg hover:bg-danger-soft text-text-3 hover:text-danger transition-colors self-start"
                                        aria-label="Remove"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {items.length > 0 && (
                    <footer className="border-t border-border px-5 py-4 space-y-3 bg-canvas">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-widest text-text-3">
                                Estimated total
                            </span>
                            <span className="text-lg font-bold text-text-1">
                                {formatCurrency(total)}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={goToCart}
                                className="px-3 py-2 text-xs font-semibold bg-surface-2 text-text-1 rounded-lg hover:bg-primary-soft transition-colors"
                            >
                                View full cart
                            </button>
                            <button
                                type="button"
                                onClick={goToCheckout}
                                className="px-3 py-2 text-xs font-semibold bg-primary text-black rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Checkout →
                            </button>
                        </div>
                    </footer>
                )}
            </aside>
        </>
    );
}
