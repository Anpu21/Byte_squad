import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, MapPin, Package } from 'lucide-react';
import QRCode from 'qrcode';
import { customerRequestsService } from '@/services/customer-requests.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { CustomerRequestStatus } from '@/types';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

const STATUS_LABEL: Record<CustomerRequestStatus, string> = {
    pending: 'Awaiting pickup',
    completed: 'Picked up',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

const STATUS_TONE: Record<CustomerRequestStatus, string> = {
    pending: 'bg-warning-soft text-warning border-warning/40',
    completed: 'bg-accent-soft text-accent-text border-accent/40',
    rejected: 'bg-danger-soft text-danger border-danger/40',
    cancelled: 'bg-slate-500/10 text-text-1 border-slate-500/30',
    expired: 'bg-slate-500/10 text-text-2 border-slate-500/30',
};

export default function RequestConfirmationPage() {
    const { code } = useParams<{ code: string }>();
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    const { data: request, isLoading, error } = useQuery({
        queryKey: ['customer-request-by-code', code],
        queryFn: () => customerRequestsService.findByCode(code!),
        enabled: !!code,
    });

    useEffect(() => {
        if (!code) return;
        let cancelled = false;
        QRCode.toDataURL(code, {
            width: 512,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M',
        })
            .then((url) => {
                if (!cancelled) setQrDataUrl(url);
            })
            .catch((err) => {
                console.error('QR render failed', err);
                if (!cancelled) setQrDataUrl(null);
            });
        return () => {
            cancelled = true;
        };
    }, [code]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-border-strong border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="max-w-md mx-auto text-center py-24">
                <h1 className="text-xl font-bold text-text-1 tracking-tight mb-2">
                    Request not found
                </h1>
                <p className="text-sm text-text-2 mb-6">
                    The request code may be invalid or expired.
                </p>
                <Link
                    to={FRONTEND_ROUTES.SHOP}
                    className="inline-block px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                >
                    Browse products
                </Link>
            </div>
        );
    }

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
                <div className="bg-primary rounded-md p-6 flex flex-col items-center">
                    {qrDataUrl ? (
                        <img
                            src={qrDataUrl}
                            alt={`QR code for request ${request.requestCode}`}
                            className="w-60 h-60"
                        />
                    ) : (
                        <div className="w-60 h-60 flex items-center justify-center text-xs text-text-2">
                            Generating QR…
                        </div>
                    )}
                    <p className="mt-4 text-xs uppercase tracking-widest text-text-3">
                        Code
                    </p>
                    <p className="font-mono text-lg font-bold text-text-inv mt-1">
                        {request.requestCode}
                    </p>
                    {qrDataUrl && (
                        <a
                            href={qrDataUrl}
                            download={`${request.requestCode}.png`}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 text-text-1 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <Download size={14} /> Download PNG
                        </a>
                    )}
                </div>

                <div className="bg-[#111] border border-border rounded-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span
                            className={`text-[11px] uppercase tracking-widest px-2 py-1 rounded-full border ${STATUS_TONE[request.status]}`}
                        >
                            {STATUS_LABEL[request.status]}
                        </span>
                        <span className="text-[11px] text-text-3">
                            {new Date(request.createdAt).toLocaleString()}
                        </span>
                    </div>

                    {request.branch && (
                        <div className="mb-4 flex items-start gap-2 text-sm">
                            <MapPin size={14} className="mt-0.5 text-text-3" />
                            <div>
                                <p className="font-semibold text-text-1">
                                    {request.branch.name}
                                </p>
                                <p className="text-text-2 text-xs mt-0.5">
                                    {request.branch.address}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-text-3">
                            <Package size={12} /> Items
                        </div>
                        <div className="space-y-1.5 text-sm">
                            {request.items.map((it) => (
                                <div
                                    key={it.id}
                                    className="flex items-center justify-between text-text-1"
                                >
                                    <span className="truncate pr-2">
                                        {it.product?.name ?? 'Unknown'} × {it.quantity}
                                    </span>
                                    <span>
                                        {formatCurrency(
                                            Number(it.unitPriceSnapshot) * it.quantity,
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest text-text-3">
                            Estimated total
                        </span>
                        <span className="text-lg font-bold text-text-1">
                            {formatCurrency(Number(request.estimatedTotal))}
                        </span>
                    </div>

                    {request.note && (
                        <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs uppercase tracking-widest text-text-3 mb-1">
                                Note
                            </p>
                            <p className="text-sm text-text-1">{request.note}</p>
                        </div>
                    )}
                </div>
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
