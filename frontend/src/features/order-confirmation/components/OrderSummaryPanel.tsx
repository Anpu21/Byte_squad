import { MapPin, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerOrder } from '@/types';
import { STATUS_LABEL, STATUS_TONE } from '../lib/status-style';
import { PaymentStatusBadge } from '@/features/my-orders/components/PaymentStatusBadge';

interface OrderSummaryPanelProps {
    order: ICustomerOrder;
}

export function OrderSummaryPanel({ order }: OrderSummaryPanelProps) {
    return (
        <div className="bg-surface border border-border rounded-md p-6">
            <div className="flex items-center justify-between mb-4">
                <span
                    className={`text-[11px] uppercase tracking-widest px-2 py-1 rounded-full border ${STATUS_TONE[order.status]}`}
                >
                    {STATUS_LABEL[order.status]}
                </span>
                <span className="text-[11px] text-text-3">
                    {new Date(order.createdAt).toLocaleString()}
                </span>
            </div>

            <div className="mb-4">
                <PaymentStatusBadge status={order.paymentStatus} />
            </div>

            {order.branch && (
                <div className="mb-4 flex items-start gap-2 text-sm">
                    <MapPin size={14} className="mt-0.5 text-text-3" />
                    <div>
                        <p className="font-semibold text-text-1">
                            {order.branch.name}
                        </p>
                        <p className="text-text-2 text-xs mt-0.5">
                            {order.branch.address}
                        </p>
                    </div>
                </div>
            )}

            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-text-3">
                    <Package size={12} /> Items
                </div>
                <div className="space-y-1.5 text-sm">
                    {order.items.map((it) => (
                        <div
                            key={it.id}
                            className="flex items-center justify-between text-text-1"
                        >
                            <span className="truncate pr-2">
                                {it.product?.name ?? 'Unknown'} × {it.quantity}
                            </span>
                            <span>
                                {formatCurrency(
                                    it.unitPriceSnapshot * it.quantity,
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-text-2">Subtotal</span>
                    <span className="text-text-1">
                        {formatCurrency(order.estimatedTotal)}
                    </span>
                </div>
                {order.loyaltyDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-2">Loyalty discount</span>
                        <span className="text-accent">
                            -{formatCurrency(order.loyaltyDiscountAmount)}
                        </span>
                    </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs uppercase tracking-widest text-text-3">
                        Final total
                    </span>
                    <span className="text-lg font-bold text-text-1">
                        {formatCurrency(order.finalTotal)}
                    </span>
                </div>
            </div>

            {order.note && (
                <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs uppercase tracking-widest text-text-3 mb-1">
                        Note
                    </p>
                    <p className="text-sm text-text-1">{order.note}</p>
                </div>
            )}
        </div>
    );
}
