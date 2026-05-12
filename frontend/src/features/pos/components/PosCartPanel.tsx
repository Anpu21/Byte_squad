import { AlertCircle, Check, CreditCard, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { usePosCart } from '../hooks/usePosCart';
import type { usePosCheckout } from '../hooks/usePosCheckout';
import type { usePosNumpad } from '../hooks/usePosNumpad';
import PosCartTable from './PosCartTable';
import PosNumpad from './PosNumpad';

interface PosCartPanelProps {
    cart: ReturnType<typeof usePosCart>;
    checkout: ReturnType<typeof usePosCheckout>;
    numpad: ReturnType<typeof usePosNumpad>;
    onClearCart: () => void;
}

export default function PosCartPanel({
    cart,
    checkout,
    numpad,
    onClearCart,
}: PosCartPanelProps) {
    return (
        <div className="w-[440px] bg-surface border border-border rounded-md shadow-md-token flex flex-col flex-shrink-0">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-text-3 font-semibold">
                        Point of Sale
                    </p>
                    <h2 className="text-base font-bold text-text-1 tracking-tight mt-0.5">
                        Current sale
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {cart.totalItems > 0 && (
                        <span className="text-[11px] font-semibold bg-primary-soft text-primary-soft-text rounded-full px-2 py-0.5 tabular-nums">
                            {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
                        </span>
                    )}
                    {cart.cart.length > 0 && (
                        <button
                            type="button"
                            onClick={onClearCart}
                            className="text-[11px] font-semibold text-text-3 hover:text-danger uppercase tracking-wider transition-colors focus:outline-none focus:ring-[3px] focus:ring-danger/20 rounded px-1"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <PosCartTable
                cart={cart.cart}
                onUpdateQuantity={cart.updateQuantity}
                onRemove={cart.removeFromCart}
            />

            {(checkout.error || checkout.lastTransaction) && (
                <div className="px-5 pt-3 space-y-2">
                    {checkout.error && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            className="p-2.5 bg-danger-soft border border-danger/30 rounded-md text-xs text-danger flex items-start gap-2"
                        >
                            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                            <span className="flex-1">{checkout.error}</span>
                        </div>
                    )}
                    {checkout.lastTransaction && (
                        <div
                            role="status"
                            aria-live="polite"
                            className="p-2.5 bg-accent-soft border border-accent/30 rounded-md flex items-start gap-2"
                        >
                            <Check
                                size={13}
                                strokeWidth={2.5}
                                className="mt-0.5 flex-shrink-0 text-accent-text"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-accent-text">
                                    Sale complete · {checkout.lastTransaction.transactionNumber}
                                </p>
                                <p className="text-[11px] text-text-2 mono mt-0.5">
                                    {formatCurrency(checkout.lastTransaction.total)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={checkout.dismissLastTransaction}
                                aria-label="Dismiss"
                                className="p-0.5 text-text-3 hover:text-text-1 -mt-0.5 -mr-0.5 rounded focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                            >
                                <X size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="px-5 py-4 border-t border-border bg-surface-2/40 space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                    <span className="text-text-2">Subtotal</span>
                    <span className="text-text-1 tabular-nums mono">
                        {formatCurrency(cart.subtotal)}
                    </span>
                </div>
                {cart.discountValue > 0 && (
                    <div className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-1.5 text-text-2">
                            Total Discount
                            {cart.discountType === 'percentage' && cart.discountAmount > 0 && (
                                <span className="text-[10px] font-semibold text-text-3 bg-canvas border border-border rounded px-1 py-0.5 mono">
                                    −{cart.discountAmount}%
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => cart.setDiscountAmount(0)}
                                aria-label="Clear discount"
                                className="p-0.5 -ml-0.5 text-text-3 hover:text-danger rounded focus:outline-none focus:ring-[2px] focus:ring-danger/20"
                            >
                                <X size={10} strokeWidth={3} />
                            </button>
                        </span>
                        <span className="text-danger tabular-nums mono">
                            −{formatCurrency(cart.discountValue)}
                        </span>
                    </div>
                )}
                <div className="pt-2 border-t border-border flex items-end justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3 pb-0.5">
                        Total · LKR
                    </span>
                    <span className="text-2xl font-bold text-text-1 tabular-nums tracking-tight leading-none mono">
                        {formatCurrency(cart.total).replace('LKR', '').trim()}
                    </span>
                </div>
            </div>

            <PosNumpad
                padMode={numpad.padMode}
                padValue={numpad.padValue}
                customName={numpad.customName}
                onCustomNameChange={numpad.setCustomName}
                onToggleMode={numpad.toggleMode}
                onPadPress={numpad.padPress}
                onPadConfirm={numpad.padConfirm}
                discountType={cart.discountType}
                onToggleDiscountType={() =>
                    cart.setDiscountType(
                        cart.discountType === 'fixed' ? 'percentage' : 'fixed',
                    )
                }
            />

            <div className="p-3 border-t border-border bg-surface">
                <button
                    type="button"
                    onClick={checkout.openPaymentModal}
                    disabled={cart.cart.length === 0}
                    className="w-full h-12 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                >
                    <CreditCard size={15} strokeWidth={2.5} />
                    <span>Complete Sale</span>
                    {cart.cart.length > 0 && (
                        <span className="tabular-nums mono opacity-90">
                            · {formatCurrency(cart.total)}
                        </span>
                    )}
                    <kbd className="ml-1 inline-flex items-center justify-center h-5 px-1.5 rounded bg-text-inv/10 text-[10px] font-bold">
                        F12
                    </kbd>
                </button>
            </div>
        </div>
    );
}
