import { useCheckout } from '@/features/checkout/hooks/useCheckout';
import { CheckoutBranchCard } from '@/features/checkout/components/CheckoutBranchCard';
import { CheckoutOrderSummary } from '@/features/checkout/components/CheckoutOrderSummary';

export function CheckoutPage() {
    const p = useCheckout();

    if (p.items.length === 0) {
        return (
            <div className="text-center py-24 text-text-3 text-sm">
                Your cart is empty.
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-text-1 tracking-tight mb-2">
                Checkout
            </h1>
            <p className="text-sm text-text-2 mb-8">
                We&apos;ll generate a QR for the counter — pay when you pick up.
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

                <CheckoutOrderSummary items={p.items} total={p.total} />

                {p.error && (
                    <div className="p-3 rounded-lg bg-danger-soft border border-danger/40 text-sm text-danger">
                        {p.error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={p.submitting || !p.branchId}
                    className="w-full bg-primary text-text-inv font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                    {p.submitting ? 'Submitting…' : 'Submit pickup request'}
                </button>

                <p className="text-[11px] text-text-3 text-center">
                    You&apos;ll pay at the counter when you pick up. The price
                    shown is an estimate based on today&apos;s prices.
                </p>
            </form>
        </div>
    );
}
