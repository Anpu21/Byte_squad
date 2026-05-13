import { useCheckout } from '@/features/checkout/hooks/useCheckout';
import { CheckoutBranchCard } from '@/features/checkout/components/CheckoutBranchCard';
import { CheckoutOrderSummary } from '@/features/checkout/components/CheckoutOrderSummary';
import { PayhereRedirectForm } from '@/features/checkout/components/PayhereRedirectForm';
import { Button, Input } from '@/components/ui';
import Segmented from '@/components/ui/Segmented';

export function CheckoutPage() {
    const p = useCheckout();

    if (p.items.length === 0 && !p.payherePayload) {
        return (
            <div className="text-center py-24 text-text-3 text-sm">
                Your cart is empty.
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {p.payherePayload && (
                <PayhereRedirectForm payment={p.payherePayload} />
            )}
            <h1 className="text-2xl font-bold text-text-1 tracking-tight mb-2">
                Checkout
            </h1>
            <p className="text-sm text-text-2 mb-8">
                Choose how you want to pay. Your QR stays available for pickup.
            </p>

            <form onSubmit={p.onSubmit} className="space-y-5">
                <CheckoutBranchCard branch={p.branch} />

                <div>
                    <label className="block text-xs uppercase tracking-widest text-text-3 mb-2">
                        Note (optional)
                    </label>
                    <textarea
                        value={p.note}
                        onChange={(e) => p.setNote(e.target.value)}
                        rows={2}
                        placeholder="Any pickup instructions"
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-1 focus:outline-none focus:border-primary resize-none"
                    />
                </div>

                <div className="bg-surface border border-border rounded-md p-5 space-y-4">
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

                    <Input
                        type="number"
                        min={0}
                        max={p.maxRedeemable}
                        value={p.loyaltyPointsToRedeem}
                        onChange={(e) =>
                            p.setLoyaltyPointsToRedeem(
                                Math.max(0, Number(e.target.value)),
                            )
                        }
                        label={`Loyalty points (${p.availablePoints} available, ${p.maxRedeemable} max)`}
                    />
                </div>

                <CheckoutOrderSummary
                    items={p.items}
                    total={p.total}
                    loyaltyDiscount={p.loyaltyDiscount}
                    finalTotal={p.finalTotal}
                    expectedPoints={p.expectedPoints}
                />

                {p.error && (
                    <div className="p-3 rounded-lg bg-danger-soft border border-danger/40 text-sm text-danger">
                        {p.error}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={p.submitting || !p.branchId || !!p.payherePayload}
                    size="lg"
                    className="w-full"
                >
                    {p.submitting
                        ? 'Submitting...'
                        : p.paymentMode === 'online'
                          ? 'Continue to PayHere'
                          : 'Submit pickup order'}
                </Button>

                <p className="text-[11px] text-text-3 text-center">
                    Manual orders are charged at pickup. Online orders are
                    confirmed after PayHere notifies LedgerPro.
                </p>
            </form>
        </div>
    );
}
