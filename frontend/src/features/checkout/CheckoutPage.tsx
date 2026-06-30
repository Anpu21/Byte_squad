import { Navigate } from 'react-router-dom';
import { useCheckout } from '@/features/checkout/hooks/useCheckout';
import { LoyaltyPointsInput } from '@/features/checkout/components/LoyaltyPointsInput';
import { Button, FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import Segmented from '@/components/ui/Segmented';
import { cn, formatCurrency } from '@/lib/utils';
import { shopLineTotal } from '@/store/selectors/shopCart';
import { FRONTEND_ROUTES } from '@/constants/routes';

export function CheckoutPage() {
    const p = useCheckout();

    if (p.items.length === 0) {
        return <Navigate to={FRONTEND_ROUTES.SHOP_CART} replace />;
    }

    const multiBranch = p.groups.length > 1;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-7">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-1 tracking-tight">
                    Checkout
                </h1>
                <p className="text-sm text-text-2 mt-1.5">
                    {multiBranch
                        ? `Your cart spans ${p.groups.length} branches — one pickup order each under a single payment.`
                        : 'Review your pickup order and choose how to pay.'}
                </p>
            </div>

            <form
                onSubmit={p.onSubmit}
                className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-7 lg:items-start"
            >
                <div className="space-y-5">
                    {p.groups.map((group) => (
                        <div
                            key={group.branchId}
                            className="bg-surface border border-border rounded-2xl shadow-sm-token overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-text-2">
                                    Pickup at {group.branchName || 'branch'}
                                </span>
                                <span className="text-xs font-semibold text-text-1 tabular-nums mono">
                                    {formatCurrency(group.subtotal)}
                                </span>
                            </div>
                            <ul className="divide-y divide-border">
                                {group.items.map((it) => (
                                    <li
                                        key={`${it.productId}:${it.unitId ?? 'base'}:${it.amount != null ? 'amt' : 'wt'}`}
                                        className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                                    >
                                        <span className="text-text-1 min-w-0">
                                            {it.name}{' '}
                                            <span className="text-text-3">
                                                × {it.quantity} {it.unitLabel}
                                            </span>
                                        </span>
                                        <span className="tabular-nums mono text-text-1 shrink-0">
                                            {formatCurrency(shopLineTotal(it))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-text-3 mb-2">
                            Note (optional)
                        </label>
                        <textarea
                            value={p.note}
                            onChange={(e) => p.setNote(e.target.value)}
                            rows={2}
                            placeholder="Any pickup instructions"
                            className={cn(FIELD_SHELL, FIELD_BORDER, 'w-full px-3 py-2.5 resize-none')}
                        />
                    </div>
                </div>

                <div className="mt-5 lg:mt-0 lg:sticky lg:top-[88px] space-y-5">
                    <div className="bg-surface border border-border rounded-2xl shadow-sm-token p-6 space-y-5">
                        <div>
                            <p className="text-[11px] uppercase tracking-widest text-text-3 mb-3">
                                Payment
                            </p>
                            <Segmented
                                value={p.paymentMode}
                                onChange={p.setPaymentMode}
                                options={[
                                    { label: 'Pay at pickup', value: 'manual' },
                                    { label: 'Pay online', value: 'online' },
                                ]}
                                className="w-full justify-center"
                            />
                        </div>

                        <LoyaltyPointsInput
                            value={p.loyaltyPointsToRedeem}
                            onChange={p.setLoyaltyPointsToRedeem}
                            availablePoints={p.availablePoints}
                            maxRedeemable={p.maxRedeemable}
                        />
                    </div>

                    <div className="bg-surface border border-border rounded-2xl shadow-sm-token p-6 space-y-2 text-sm">
                        <div className="flex justify-between text-text-2">
                            <span>Subtotal</span>
                            <span className="tabular-nums mono">
                                {formatCurrency(p.total)}
                            </span>
                        </div>
                        {p.loyaltyDiscount > 0 && (
                            <div className="flex justify-between text-success">
                                <span>Loyalty discount</span>
                                <span className="tabular-nums mono">
                                    −{formatCurrency(p.loyaltyDiscount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-baseline font-bold text-text-1 pt-3 mt-1 border-t border-border">
                            <span>Total</span>
                            <span className="tabular-nums mono text-lg">
                                {formatCurrency(p.finalTotal)}
                            </span>
                        </div>
                        <p className="text-xs text-text-3 pt-1">
                            You&apos;ll earn about {p.expectedPoints} points.
                        </p>
                    </div>

                    {p.error && (
                        <div className="p-3 rounded-xl bg-danger-soft border border-danger/40 text-sm text-danger">
                            {p.error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={p.submitting}
                        size="lg"
                        className="w-full"
                    >
                        {p.submitting
                            ? 'Submitting...'
                            : p.paymentMode === 'online'
                              ? 'Continue to PayHere'
                              : multiBranch
                                ? `Place ${p.groups.length} pickup orders`
                                : 'Place pickup order'}
                    </Button>

                    <p className="text-[11px] text-text-3 text-center">
                        Manual orders are charged at pickup. Online orders are
                        confirmed after PayHere notifies LedgerPro.
                    </p>
                </div>
            </form>
        </div>
    );
}
