import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { ExternalLink, MapPin } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { CustomerRequestStatus, ICustomerRequest } from '@/types';
import { ShopRequestQrPanel } from './ShopRequestQrPanel';
import { ShopRequestItemsList } from './ShopRequestItemsList';

interface RequestDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: ICustomerRequest | null;
}

const STATUS_LABEL: Record<CustomerRequestStatus, string> = {
    pending: 'Awaiting pickup',
    accepted: 'Ready for pickup',
    completed: 'Picked up',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

const STATUS_TONE: Record<CustomerRequestStatus, string> = {
    pending: 'bg-warning-soft text-warning border-warning/40',
    accepted: 'bg-primary-soft text-primary-soft-text border-primary/40',
    completed: 'bg-accent-soft text-accent-text border-accent/40',
    rejected: 'bg-danger-soft text-danger border-danger/40',
    cancelled: 'bg-surface-2 text-text-2 border-border',
    expired: 'bg-surface-2 text-text-2 border-border',
};

export function RequestDetailsModal({
    isOpen,
    onClose,
    request,
}: RequestDetailsModalProps) {
    const [fallback, setFallback] = useState<{ code: string; url: string } | null>(null);

    // If the backend never stored a QR (legacy rows or Cloudinary disabled),
    // generate one client-side from the request code so we always have a QR
    // to render.
    useEffect(() => {
        if (!isOpen || !request || request.qrCodeUrl) return;
        const requestCode = request.requestCode;
        let cancelled = false;
        QRCode.toDataURL(requestCode, {
            width: 512,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M',
        })
            .then((url) => {
                if (!cancelled) setFallback({ code: requestCode, url });
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
        (fallback?.code === request.requestCode ? fallback.url : null);
    const fullPagePath = FRONTEND_ROUTES.SHOP_REQUEST_CONFIRMATION.replace(
        ':code',
        request.requestCode,
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Pickup request · ${request.requestCode}`}
            maxWidth="2xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ShopRequestQrPanel
                    qrSrc={qrSrc}
                    requestCode={request.requestCode}
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

                    <ShopRequestItemsList
                        items={request.items}
                        estimatedTotal={request.estimatedTotal}
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
