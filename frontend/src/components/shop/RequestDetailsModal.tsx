import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { Download, ExternalLink, MapPin } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { CustomerRequestStatus, ICustomerRequest } from '@/types';

interface RequestDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: ICustomerRequest | null;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
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

export default function RequestDetailsModal({
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
                {/* QR panel */}
                <div className="bg-primary rounded-md p-5 flex flex-col items-center">
                    {qrSrc ? (
                        <img
                            src={qrSrc}
                            alt={`QR code for request ${request.requestCode}`}
                            className="w-48 h-48 bg-surface rounded-md"
                        />
                    ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-xs text-text-inv/70">
                            Generating QR…
                        </div>
                    )}
                    <p className="mt-3 text-[10px] uppercase tracking-widest text-text-inv/70">
                        Code
                    </p>
                    <p className="font-mono text-base font-bold text-text-inv mt-0.5">
                        {request.requestCode}
                    </p>
                    {qrSrc && (
                        <a
                            href={qrSrc}
                            download={`${request.requestCode}.png`}
                            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-surface text-text-1 border border-border rounded-md hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                        >
                            <Download size={12} /> Download QR
                        </a>
                    )}
                </div>

                {/* Details panel */}
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

                    <div className="border-t border-border pt-3 flex-1 overflow-y-auto max-h-[240px]">
                        <p className="text-[10px] uppercase tracking-widest text-text-3 mb-2">
                            Items
                        </p>
                        <ul className="divide-y divide-border">
                            {request.items.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="text-[13px] text-text-1 truncate">
                                            {item.product?.name ?? 'Item'}
                                        </p>
                                        <p className="text-[11px] text-text-3">
                                            {formatCurrency(
                                                item.unitPriceSnapshot,
                                            )}{' '}
                                            × {item.quantity}
                                        </p>
                                    </div>
                                    <p className="text-[13px] font-medium text-text-1 tabular-nums whitespace-nowrap">
                                        {formatCurrency(
                                            item.unitPriceSnapshot *
                                                item.quantity,
                                        )}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
                        <p className="text-xs text-text-3">Estimated total</p>
                        <p className="text-base font-bold text-text-1 tabular-nums">
                            {formatCurrency(request.estimatedTotal)}
                        </p>
                    </div>

                    {request.note && (
                        <div className="mt-3 px-3 py-2 rounded-md bg-surface-2 border border-border text-[12px] text-text-2">
                            <span className="font-semibold text-text-1">
                                Note:{' '}
                            </span>
                            {request.note}
                        </div>
                    )}

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
