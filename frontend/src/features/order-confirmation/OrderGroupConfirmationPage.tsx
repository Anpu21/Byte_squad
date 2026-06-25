import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { customerOrdersService } from '@/services/customer-orders.service';
import { formatCurrency } from '@/lib/utils';
import { QrCodeCard } from '@/features/order-confirmation/components/QrCodeCard';
import { OrderSummaryPanel } from '@/features/order-confirmation/components/OrderSummaryPanel';
import { OrderNotFound } from '@/features/order-confirmation/components/OrderNotFound';

/**
 * Confirmation for a multi-branch checkout: one PayHere payment (or pay-at-
 * pickup) split into one order per branch under a shared group code. Each
 * branch order shows its own QR code for counter pickup.
 */
export function OrderGroupConfirmationPage() {
    const { code } = useParams<{ code: string }>();
    const {
        data: orders,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['customer-orders', 'group', code],
        queryFn: () => customerOrdersService.findGroup(code!),
        enabled: !!code,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !orders || orders.length === 0) return <OrderNotFound />;

    const first = orders[0];
    const groupTotal = orders.reduce((sum, o) => sum + Number(o.finalTotal), 0);
    const online = first.paymentMode === 'online';
    const paid = first.paymentStatus === 'paid';
    const message = online
        ? paid
            ? 'Online payment confirmed. Show each QR code at the matching branch.'
            : 'Online payment is pending. This page updates to paid once PayHere notifies LedgerPro.'
        : 'Show each QR code at the matching branch and pay when you pick up.';

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Pickup orders ready
                </h1>
                <p className="text-sm text-text-2 mt-2">{message}</p>
                <p className="text-sm text-text-1 font-semibold mt-1">
                    {orders.length} branch{orders.length === 1 ? '' : 'es'} ·{' '}
                    {formatCurrency(groupTotal)}
                </p>
            </div>

            <div className="space-y-8">
                {orders.map((o) => (
                    <div
                        key={o.id}
                        className="bg-surface border border-border rounded-md p-5"
                    >
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-2 mb-4">
                            Pickup at {o.branch?.name ?? 'branch'} · {o.orderCode}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <QrCodeCard
                                qrDataUrl={o.qrCodeUrl}
                                orderCode={o.orderCode}
                            />
                            <OrderSummaryPanel order={o} />
                        </div>
                    </div>
                ))}
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
