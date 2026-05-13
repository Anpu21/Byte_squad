import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { ExternalLink, MapPin } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { CustomerOrderStatus, ICustomerOrder } from '@/types';
import { ShopOrderQrPanel } from './ShopOrderQrPanel';
import { ShopOrderItemsList } from './ShopOrderItemsList';
import { PaymentStatusBadge } from '@/features/my-orders/components/PaymentStatusBadge';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: ICustomerOrder | null;
}

const STATUS_LABEL: Record<CustomerOrderStatus, string> = {
    pending: 'Awaiting pickup',
    accepted: 'Ready for pickup',
    completed: 'Picked up',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

const STATUS_TONE: Record<CustomerOrderStatus, string> = {
    pending: 'bg-warning-soft text-warning border-warning/40',
    accepted: 'bg-primary-soft text-primary-soft-text border-primary/40',
    completed: 'bg-accent-soft text-accent-text border-accent/40',
    rejected: 'bg-danger-soft text-danger border-danger/40',
    cancelled: 'bg-surface-2 text-text-2 border-border',
    expired: 'bg-surface-2 text-text-2 border-border',
};

export function OrderDetailsModal({
    isOpen,
    onClose,
    request,
}: OrderDetailsModalProps) {
    const [fallback, setFallback] = useState<{ code: string; url: string } | null>(null);

    // If the backend never stored a QR (legacy rows or Cloudinary disabled),
    // generate one client-side from the order code so we always have a QR
    // to render.
    useEffect(() => {
        if (!isOpen || !request || request.qrCodeUrl) return;
        const orderCode = request.orderCode;
        let cancelled = false;
        QRCode.toDataURL(orderCode, {
            width: 512,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M',
        })
            .then((url) => {
                if (!cancelled) setFallback({ code: orderCode, url });
            })
            .catch(() => {
                if (!cancelled) setFallback(null);
            });
        return () => {
            cancelled = true;
        };
    }, [isOpen, request]);

    if (!request) return null;

    const qrSrc =
        request.qrCodeUrl ??
        (fallback?.code === request.orderCode ? fallback.url : null);
    const fullPagePath = FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
        ':code',
        request.orderCode,
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Pickup order · ${request.orderCode}`}
            maxWidth="2xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ShopOrderQrPanel
                    qrSrc={qrSrc}
                    orderCode={request.orderCode}
                />

                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <span
                            className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_TONE[request.status]}`}
                        >
                            {STATUS_LABEL[request.status]}
                        </span>
                        <span className="text-[10px] text-text-3">
                            {new Date(request.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <div className="mb-3">
                        <PaymentStatusBadge status={request.paymentStatus} />
                    </div>

                    {request.branch && (
                        <div className="mb-3 flex items-start gap-2 text-sm">
                            <MapPin
                                size={14}
                                className="mt-0.5 text-text-3 flex-shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="font-semibold text-text-1 truncate">
                                    {request.branch.name}
                                </p>
                                {request.branch.address && (
                                    <p className="text-text-2 text-xs mt-0.5">
                                        {request.branch.address}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <ShopOrderItemsList
                        items={request.items}
                        estimatedTotal={request.estimatedTotal}
                        loyaltyDiscountAmount={request.loyaltyDiscountAmount}
                        finalTotal={request.finalTotal}
                        note={request.note}
                    />

                    <Link
                        to={fullPagePath}
                        onClick={onClose}
                        className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-text-2 hover:text-text-1 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20 rounded"
                    >
                        Open full page <ExternalLink size={11} />
                    </Link>
                </div>
            </div>
        </Modal>
    );
}
