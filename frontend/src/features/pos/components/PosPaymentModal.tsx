import { Banknote } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import type { usePosCart } from '../hooks/usePosCart';
import type { usePosCheckout } from '../hooks/usePosCheckout';

interface PosPaymentModalProps {
    cart: ReturnType<typeof usePosCart>;
    checkout: ReturnType<typeof usePosCheckout>;
}

const QUICK_CASH = [100, 500, 1000, 5000];

export function PosPaymentModal({ cart, checkout }: PosPaymentModalProps) {
    const cashShort =
        checkout.cashTendered !== '' &&
        parseFloat(checkout.cashTendered) < cart.total;
    const cashEnough =
        checkout.cashTendered !== '' &&
        parseFloat(checkout.cashTendered) >= cart.total;

    return (
        <Modal
            isOpen={checkout.showPaymentModal}
            onClose={checkout.closePaymentModal}
            title="Complete Sale"
            maxWidth="md"
        >
            <div>
                <div className="mb-5 p-4 bg-surface-2 rounded-xl border border-border">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-2">
                            {cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''}
                        </span>
                        <span className="text-text-1 tabular-nums">
                            {formatCurrency(cart.subtotal)}
                        </span>
                    </div>
                    {cart.totalDiscount > 0 && (
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-text-2">Discount</span>
                            <span className="text-text-1 tabular-nums">
                                -{formatCurrency(cart.totalDiscount)}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-end pt-2 border-t border-border">
                        <span className="text-sm font-semibold text-text-1">Total</span>
                        <span className="text-xl font-bold text-text-1 tabular-nums">
                            {formatCurrency(cart.total)}
                        </span>
                    </div>
                </div>

                <div className="mb-5 p-4 bg-surface-2 rounded-xl border border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <Banknote
                            size={16}
                            strokeWidth={1.75}
                            className="text-text-2"
                        />
                        <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
                            Cash Received
                        </p>
                    </div>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={checkout.cashTendered}
                        onChange={(e) => checkout.setCashTendered(e.target.value)}
                        placeholder={cart.total.toFixed(2)}
                        className="w-full h-12 px-4 bg-canvas border border-border rounded-lg text-xl text-text-1 font-bold tabular-nums outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        autoFocus
                        aria-label="Cash received"
                    />
                    <div className="grid grid-cols-4 gap-2 mt-2">
                        {QUICK_CASH.map((amt) => (
                            <button
                                key={amt}
                                type="button"
                                onClick={() =>
                                    checkout.setCashTendered(String(amt))
                                }
                                className="h-8 rounded-lg bg-surface-2 border border-border text-xs font-bold text-text-1 hover:text-text-1 hover:bg-primary-soft transition-colors tabular-nums"
                            >
                                {amt.toLocaleString()}
                            </button>
                        ))}
                    </div>
                    {cashEnough && (
                        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                            <span className="text-sm font-semibold text-text-2">
                                Change Due
                            </span>
                            <span className="text-2xl font-bold text-text-1 tabular-nums">
                                {formatCurrency(checkout.cashChange)}
                            </span>
                        </div>
                    )}
                    {cashShort && (
                        <p className="mt-2 text-xs text-danger">
                            Insufficient amount — need{' '}
                            {formatCurrency(
                                cart.total - parseFloat(checkout.cashTendered),
                            )}{' '}
                            more
                        </p>
                    )}
                </div>

                {checkout.error && (
                    <div className="mb-4 p-3 bg-danger-soft border border-danger/30 rounded-lg text-sm text-danger">
                        {checkout.error}
                    </div>
                )}

                <button
                    type="button"
                    onClick={checkout.handleCheckout}
                    disabled={checkout.isCheckingOut || cashShort}
                    className="w-full h-12 rounded-xl bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {checkout.isCheckingOut ? (
                        <>
                            <div className="w-4 h-4 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>Confirm {formatCurrency(cart.total)}</>
                    )}
                </button>
            </div>
        </Modal>
    );
}
