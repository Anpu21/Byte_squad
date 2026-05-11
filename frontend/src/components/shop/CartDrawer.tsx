import { useEffect, useRef } from 'react';
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
import ProductImage from '@/components/shop/ProductImage';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function CartDrawer() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const items = useSelector((state: RootState) => state.shopCart.items);
    const isOpen = useSelector((state: RootState) => state.shopCart.isCartOpen);
    const total = selectCartTotal(items);

    const panelRef = useRef<HTMLDivElement>(null);
    const previousActiveRef = useRef<HTMLElement | null>(null);

    // Body scroll lock + initial focus + focus restore + ESC + focus trap.
    useEffect(() => {
        if (!isOpen) return;

        previousActiveRef.current = document.activeElement as HTMLElement | null;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const focusFrame = requestAnimationFrame(() => {
            const panel = panelRef.current;
            if (!panel) return;
            const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
            (first ?? panel).focus();
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                dispatch(closeCartDrawer());
                return;
            }
            if (e.key !== 'Tab' || !panelRef.current) return;
            const focusables = Array.from(
                panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
            );
            if (focusables.length === 0) {
                e.preventDefault();
                panelRef.current.focus();
                return;
            }
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;
            if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
            const previous = previousActiveRef.current;
            if (previous && document.contains(previous)) {
                previous.focus();
            }
        };
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
                aria-hidden="true"
                style={{ background: 'var(--overlay)' }}
                className={`fixed inset-0 z-overlay transition-opacity ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            />
            <aside
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label="Shopping cart"
                aria-hidden={!isOpen}
                {...(!isOpen && { inert: '' as unknown as boolean })}
                className={`fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-canvas border-l border-border z-modal flex flex-col transform transition-transform duration-300 outline-none ${
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
                        className="p-1.5 rounded-lg hover:bg-surface-2 text-text-2 hover:text-text-1 focus:outline-none focus:ring-[3px] focus:ring-primary/20"
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
                        <ul className="divide-y divide-border">
                            {items.map((item) => (
                                <li
                                    key={item.productId}
                                    className="flex items-center gap-3 px-5 py-3"
                                >
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
                                        className="p-2 rounded-md hover:bg-danger-soft text-text-3 hover:text-danger transition-colors self-start focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                                        aria-label={`Remove ${item.name} from cart`}
                                    >
                                        <Trash2 size={14} />
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
                            <span className="text-lg font-bold text-text-1 tabular-nums">
                                {formatCurrency(total)}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={goToCart}
                                className="px-3 py-2 text-xs font-semibold bg-surface-2 text-text-1 rounded-lg hover:bg-primary-soft transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                            >
                                View full cart
                            </button>
                            <button
                                type="button"
                                onClick={goToCheckout}
                                className="px-3 py-2 text-xs font-semibold bg-primary text-text-inv rounded-lg hover:bg-primary-hover transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20"
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
