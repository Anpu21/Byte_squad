import { type RefObject } from 'react';
import { AlertCircle, Check, CreditCard, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { IProduct } from '@/types';
import type { usePosCart } from '../hooks/usePosCart';
import type { usePosCheckout } from '../hooks/usePosCheckout';
import { PosCartTable } from './PosCartTable';

interface PosCartPanelProps {
    cart: ReturnType<typeof usePosCart>;
    checkout: ReturnType<typeof usePosCheckout>;
    branchId: string | null | undefined;
    stockByProductId?: Record<string, number>;
    onOpenCamera: () => void;
    inputRef: RefObject<HTMLInputElement | null>;
    onSelectProduct: (product: IProduct) => void;
}

export function PosCartPanel({
    cart,
    checkout,
    branchId,
    stockByProductId,
    onOpenCamera,
    inputRef,
    onSelectProduct,
}: PosCartPanelProps) {
    const isEmpty = cart.cart.length === 0;

    return (
        <div className="flex-1 min-h-0 min-w-0 bg-surface border border-border rounded-md shadow-md-token flex flex-col">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-text-3 font-semibold">
                        Point of Sale
                    </p>
                    <h2 className="text-base font-bold text-text-1 tracking-tight mt-0.5">
                        Current sale
                    </h2>
                </div>
                {cart.totalItems > 0 && (
                    <span className="text-[11px] font-semibold bg-primary-soft text-primary-soft-text rounded-full px-2 py-0.5 tabular-nums">
                        {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
                    </span>
                )}
            </div>

            <PosCartTable
                cart={cart.cart}
                onUpdateQuantity={cart.updateQuantity}
                onRemove={cart.removeFromCart}
                onSetItemDiscount={cart.setItemDiscount}
                totalDiscount={cart.totalDiscount}
                total={cart.total}
                branchId={branchId}
                stockByProductId={stockByProductId}
                onSelectProduct={onSelectProduct}
                onOpenCamera={onOpenCamera}
                inputRef={inputRef}
            />

            {cart.blockedReason && (
                <div className="px-5 pt-3">
                    <div
                        role="alert"
                        aria-live="polite"
                        className="p-2.5 bg-warning-soft border border-warning/30 rounded-md text-xs text-warning flex items-start gap-2"
                    >
                        <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                        <span className="flex-1">{cart.blockedReason}</span>
                        <button
                            type="button"
                            onClick={cart.dismissBlockedReason}
                            aria-label="Dismiss"
                            className="p-0.5 text-text-3 hover:text-text-1 -mt-0.5 -mr-0.5 rounded focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                        >
                            <X size={12} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            )}

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

            <div className="p-3 border-t border-border bg-surface">
                <button
                    type="button"
                    onClick={checkout.openPaymentModal}
                    disabled={isEmpty}
                    className="w-full h-12 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                >
                    <CreditCard size={15} strokeWidth={2.5} />
                    <span>Pay</span>
                    {!isEmpty && (
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
