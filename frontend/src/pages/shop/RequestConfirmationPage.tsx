import { Link } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useRequestConfirmation } from '@/features/request-confirmation/hooks/useRequestConfirmation';
import { QrCodeCard } from '@/features/request-confirmation/components/QrCodeCard';
import { RequestSummaryPanel } from '@/features/request-confirmation/components/RequestSummaryPanel';
import { RequestNotFound } from '@/features/request-confirmation/components/RequestNotFound';

export function RequestConfirmationPage() {
    const p = useRequestConfirmation();

    if (p.isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (p.error || !p.request) return <RequestNotFound />;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Pickup request ready
                </h1>
                <p className="text-sm text-text-2 mt-2">
                    Show this QR code at the counter to pick up your order.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QrCodeCard
                    qrDataUrl={p.qrDataUrl}
                    requestCode={p.request.requestCode}
                />
                <RequestSummaryPanel request={p.request} />
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
