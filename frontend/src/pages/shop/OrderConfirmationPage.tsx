import { Link } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useOrderConfirmation } from '@/features/order-confirmation/hooks/useOrderConfirmation';
import { QrCodeCard } from '@/features/order-confirmation/components/QrCodeCard';
import { OrderSummaryPanel } from '@/features/order-confirmation/components/OrderSummaryPanel';
import { OrderNotFound } from '@/features/order-confirmation/components/OrderNotFound';
import { PointsEarnedBanner } from '@/features/loyalty/components/PointsEarnedBanner';

export function OrderConfirmationPage() {
    const p = useOrderConfirmation();

    if (p.isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (p.error || !p.order) return <OrderNotFound />;

    const paymentMessage =
        p.order.paymentMode === 'online'
            ? p.order.paymentStatus === 'paid'
                ? 'Online payment is confirmed. Show this QR code at the counter.'
                : 'Online payment is still pending. This page will show paid after PayHere notifies LedgerPro.'
            : 'Show this QR code at the counter and pay when you pick up.';

    const isCompleted = p.order.status === 'completed';
    const pointsEarned = Number(p.order.loyaltyPointsEarned ?? 0);

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Pickup order ready
                </h1>
                <p className="text-sm text-text-2 mt-2">
                    {paymentMessage}
                </p>
            </div>

            {isCompleted && <PointsEarnedBanner pointsEarned={pointsEarned} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QrCodeCard
                    qrDataUrl={p.qrDataUrl}
                    orderCode={p.order.orderCode}
                />
                <OrderSummaryPanel order={p.order} />
            </div>

            <div className="mt-8 text-center">
                <Link
                    to={FRONTEND_ROUTES.SHOP}
                    className="text-sm text-text-2 hover:text-text-1"
                >
                    ← Continue shopping
                </Link>
            </div>
        </div>
    );
}
