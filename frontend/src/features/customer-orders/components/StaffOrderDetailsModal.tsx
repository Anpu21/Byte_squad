import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Mail, MapPin, Phone, User } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import StatusPill from '@/components/ui/StatusPill';
import type { ICustomerOrder } from '@/types';
import { OrderItemsList } from './OrderItemsList';
import { OrderStatusActions } from './OrderStatusActions';
import { PaymentStatusBadge } from '@/features/my-orders/components/PaymentStatusBadge';
import { STAFF_ORDER_STATUS_LABEL } from '@/features/customer-orders/lib/order-status';

interface StaffOrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: ICustomerOrder | null;
    canManage: boolean;
    onCollect: (order: ICustomerOrder) => void | Promise<void>;
    onMarkNotCollected: (id: string) => void | Promise<void>;
    actionPending?: boolean;
}

export function StaffOrderDetailsModal({
    isOpen,
    onClose,
    request,
    canManage,
    onCollect,
    onMarkNotCollected,
    actionPending = false,
}: StaffOrderDetailsModalProps) {
    const [fallback, setFallback] = useState<{ code: string; url: string } | null>(null);

    useEffect(() => {
        if (!isOpen || !request || request.qrCodeUrl) return;
        const orderCode = request.orderCode;
        let cancelled = false;
        QRCode.toDataURL(orderCode, {
            width: 320,
            margin: 1,
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
    const customerName = request.user
        ? `${request.user.firstName} ${request.user.lastName}`
        : (request.guestName ?? 'Guest');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Pickup order · ${request.orderCode}`}
            maxWidth="2xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: customer + items */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusPill
                                status={request.status}
                                label={STAFF_ORDER_STATUS_LABEL[request.status]}
                            />
                            <PaymentStatusBadge
                                status={request.paymentStatus}
                            />
                        </div>
                        <span className="text-[10px] text-text-3">
                            {new Date(request.createdAt).toLocaleString()}
                        </span>
                    </div>

                    {/* Customer info */}
                    <div className="rounded-md border border-border bg-surface-2 p-3 mb-3 space-y-1.5">
                        <p className="text-[10px] uppercase tracking-widest text-text-3">
                            Customer
                        </p>
                        <div className="flex items-center gap-2 text-sm text-text-1">
                            <User size={13} className="text-text-3 flex-shrink-0" />
                            <span className="font-semibold truncate">
                                {customerName}
                            </span>
                        </div>
                        {request.user?.email && (
                            <div className="flex items-center gap-2 text-xs text-text-2">
                                <Mail size={12} className="text-text-3 flex-shrink-0" />
                                <span className="truncate">
                                    {request.user.email}
                                </span>
                            </div>
                        )}
                        {request.user?.phone && (
                            <div className="flex items-center gap-2 text-xs text-text-2">
                                <Phone size={12} className="text-text-3 flex-shrink-0" />
                                <span>{request.user.phone}</span>
                            </div>
                        )}
                        {request.branch && (
                            <div className="flex items-center gap-2 text-xs text-text-2 pt-1 border-t border-border mt-2">
                                <MapPin size={12} className="text-text-3 flex-shrink-0" />
                                <span className="truncate">
                                    {request.branch.name}
                                </span>
                            </div>
                        )}
                    </div>

                    <OrderItemsList
                        items={request.items}
                        estimatedTotal={request.estimatedTotal}
                        loyaltyDiscountAmount={request.loyaltyDiscountAmount}
                        finalTotal={request.finalTotal}
                        note={request.note}
                    />
                </div>

                {/* Right: QR + actions */}
                <div className="flex flex-col">
                    <div className="bg-primary rounded-md p-5 flex flex-col items-center">
                        {qrSrc ? (
                            <img
                                src={qrSrc}
                                alt={`QR code for order ${request.orderCode}`}
                                className="w-44 h-44 bg-surface rounded-md"
                            />
                        ) : (
                            <div className="w-44 h-44 flex items-center justify-center text-xs text-text-inv/70">
                                Generating QR…
                            </div>
                        )}
                        <p className="mt-3 text-[10px] uppercase tracking-widest text-text-inv/70">
                            Pickup code
                        </p>
                        <p className="font-mono text-base font-bold text-text-inv mt-0.5">
                            {request.orderCode}
                        </p>
                    </div>

                    <OrderStatusActions
                        order={request}
                        canManage={canManage}
                        actionPending={actionPending}
                        onCollect={onCollect}
                        onMarkNotCollected={onMarkNotCollected}
                    />
                </div>
            </div>
        </Modal>
    );
}
