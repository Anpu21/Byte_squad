import {
    LuCalendar as Calendar,
    LuMapPin as MapPin,
    LuEye as Eye,
    LuChevronDown as ChevronDown,
} from 'react-icons/lu';
import { cn, formatCurrency } from '@/lib/utils';
import type { ICustomerOrder } from '@/types';
import { StatusBadge } from './StatusBadge';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { OrderExpandPanel } from './OrderExpandPanel';
import { formatOrderDate } from '../lib/status-style';

interface MyOrderCardProps {
    order: ICustomerOrder;
    expanded: boolean;
    onToggle: () => void;
    onCancel: (id: string) => void;
}

export function MyOrderCard({
    order,
    expanded,
    onToggle,
    onCancel,
}: MyOrderCardProps) {
    const cancelable =
        order.status === 'pending' && order.paymentStatus !== 'paid';
    const itemCount = order.items.length;

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm-token">
            <div className="grid gap-5 p-5 sm:grid-cols-[1.5fr_1fr_auto] sm:items-center sm:p-6">
                <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                        <span className="mono text-sm font-semibold text-accent-text">
                            {order.orderCode}
                        </span>
                        <StatusBadge status={order.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-text-2">
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar size={13} className="opacity-70" />
                            {formatOrderDate(order.createdAt)}
                        </span>
                        {order.branch && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin size={13} className="opacity-70" />
                                {order.branch.name}
                            </span>
                        )}
                        <span>
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                    </div>
                </div>

                <div className="sm:text-right">
                    <p className="text-lg font-bold text-text-1 tabular-nums">
                        {formatCurrency(order.finalTotal)}
                    </p>
                    {order.loyaltyDiscountAmount > 0 && (
                        <p className="text-[11px] text-accent">
                            −{formatCurrency(order.loyaltyDiscountAmount)} reward
                        </p>
                    )}
                    <div className="mt-1.5 sm:flex sm:justify-end">
                        <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:min-w-[120px] sm:flex-col sm:items-stretch">
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-expanded={expanded}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-2 px-4 py-2 text-[13px] font-semibold text-text-1 transition-colors hover:bg-surface-hover focus:outline-none focus:ring-[3px] focus:ring-focus/25"
                    >
                        <Eye size={14} /> {expanded ? 'Hide' : 'View'}
                        <ChevronDown
                            size={14}
                            className={cn(
                                'transition-transform',
                                expanded && 'rotate-180',
                            )}
                        />
                    </button>
                    {cancelable && (
                        <button
                            type="button"
                            onClick={() => onCancel(order.id)}
                            className="rounded-xl border border-danger/30 px-4 py-2 text-[13px] font-semibold text-danger transition-colors hover:bg-danger-soft focus:outline-none focus:ring-[3px] focus:ring-danger/25"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            <div className="px-5 pb-5 sm:px-6">
                <OrderStatusTimeline status={order.status} />
            </div>

            {expanded && <OrderExpandPanel order={order} />}
        </div>
    );
}
