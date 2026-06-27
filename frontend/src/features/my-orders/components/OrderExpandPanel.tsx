import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import {
    LuExternalLink as ExternalLink,
    LuMapPin as MapPin,
} from 'react-icons/lu';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { ICustomerOrder } from '@/types';
import { ShopOrderQrPanel } from '@/components/shop/ShopOrderQrPanel';
import { ShopOrderItemsList } from '@/components/shop/ShopOrderItemsList';

interface OrderExpandPanelProps {
    order: ICustomerOrder;
}

/**
 * Inline detail revealed when an order card expands — the pickup QR and full
 * line breakdown that used to live in the details modal. Mounts only while the
 * card is open, so the client-side QR fallback runs for the open order alone.
 */
export function OrderExpandPanel({ order }: OrderExpandPanelProps) {
    const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

    // If the backend never stored a QR (legacy rows or Cloudinary disabled),
    // generate one client-side from the order code.
    useEffect(() => {
        if (order.qrCodeUrl) return;
        let cancelled = false;
        QRCode.toDataURL(order.orderCode, {
            width: 512,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M',
        })
            .then((url) => {
                if (!cancelled) setFallbackUrl(url);
            })
            .catch(() => {
                if (!cancelled) setFallbackUrl(null);
            });
        return () => {
            cancelled = true;
        };
    }, [order.qrCodeUrl, order.orderCode]);

    const qrSrc = order.qrCodeUrl ?? fallbackUrl;
    const fullPagePath = FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
        ':code',
        order.orderCode,
    );

    return (
        <div className="grid grid-cols-1 gap-6 border-t border-border bg-surface-2 p-5 sm:grid-cols-[14rem_1fr] sm:p-6">
            <ShopOrderQrPanel qrSrc={qrSrc} orderCode={order.orderCode} />

            <div className="flex flex-col">
                {order.branch && (
                    <div className="mb-3 flex items-start gap-2 text-sm">
                        <MapPin
                            size={14}
                            className="mt-0.5 flex-shrink-0 text-text-3"
                        />
                        <div className="min-w-0">
                            <p className="truncate font-semibold text-text-1">
                                {order.branch.name}
                            </p>
                            {order.branch.address && (
                                <p className="mt-0.5 text-xs text-text-2">
                                    {order.branch.address}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <ShopOrderItemsList
                    items={order.items}
                    estimatedTotal={order.estimatedTotal}
                    loyaltyDiscountAmount={order.loyaltyDiscountAmount}
                    finalTotal={order.finalTotal}
                    note={order.note}
                />

                <Link
                    to={fullPagePath}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded text-xs font-medium text-text-2 transition-colors hover:text-text-1 focus:outline-none focus:ring-[3px] focus:ring-focus/25"
                >
                    Open full page <ExternalLink size={11} />
                </Link>
            </div>
        </div>
    );
}
