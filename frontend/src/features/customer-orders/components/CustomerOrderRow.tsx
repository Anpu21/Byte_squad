import { LuBan as Ban, LuCheck as Check, LuEye as Eye } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import StatusPill from '@/components/ui/StatusPill';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerOrder } from '@/types';
import { formatOrderDateTime } from '../lib/date-helpers';
import {
    STAFF_ORDER_STATUS_LABEL,
    isAwaitingCollection,
} from '../lib/order-status';
import { PaymentStatusBadge } from '@/features/my-orders/components/PaymentStatusBadge';

interface CustomerOrderRowProps {
    request: ICustomerOrder;
    showBranchCol: boolean;
    canManage: boolean;
    actionPending: boolean;
    onView: (id: string) => void;
    onCollect: (order: ICustomerOrder) => void;
    onMarkNotCollected: (id: string) => void;
}

export function CustomerOrderRow({
    request: req,
    showBranchCol,
    canManage,
    actionPending,
    onView,
    onCollect,
    onMarkNotCollected,
}: CustomerOrderRowProps) {
    const customerName = req.user
        ? `${req.user.firstName} ${req.user.lastName}`
        : (req.guestName ?? 'Guest');

    const awaiting = isAwaitingCollection(req.status);
    // Online pre-paid orders collect in one click; pay-at-pickup orders take
    // payment at the POS (onCollect routes there). Online-but-unpaid orders
    // aren't collectable yet, so no Collect action is offered.
    const onlinePaid =
        req.paymentMode === 'online' && req.paymentStatus === 'paid';
    const canCollect = onlinePaid || req.paymentMode === 'manual';

    return (
        <tr className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors">
            <td className="px-5 py-3 mono text-xs text-text-1">
                {req.orderCode}
            </td>
            <td className="px-5 py-3 mono text-xs text-text-2">
                {formatOrderDateTime(req.createdAt)}
            </td>
            {showBranchCol && (
                <td className="px-5 py-3 text-[13px] text-text-1">
                    {req.branch?.name ?? '—'}
                </td>
            )}
            <td className="px-5 py-3 text-[13px] text-text-1">{customerName}</td>
            <td className="px-5 py-3 mono text-[13px] text-text-2 text-right">
                {req.items.length}
            </td>
            <td className="px-5 py-3 mono text-[13px] font-semibold text-text-1 text-right">
                {formatCurrency(Number(req.finalTotal))}
            </td>
            <td className="px-5 py-3">
                <StatusPill
                    status={req.status}
                    label={STAFF_ORDER_STATUS_LABEL[req.status]}
                />
            </td>
            <td className="px-5 py-3">
                <PaymentStatusBadge status={req.paymentStatus} />
            </td>
            <td className="px-5 py-3 text-right">
                <div className="flex justify-end items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onView(req.id)}
                        aria-label={`View pickup order ${req.orderCode}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-text-2 hover:text-text-1 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20 rounded px-2 py-1"
                    >
                        <Eye size={12} />
                        View
                    </button>
                    {awaiting && canManage && (
                        <>
                            {canCollect && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => onCollect(req)}
                                    disabled={actionPending}
                                >
                                    <Check size={12} />
                                    Collect
                                </Button>
                            )}
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => onMarkNotCollected(req.id)}
                                disabled={actionPending}
                            >
                                <Ban size={12} />
                                Not collected
                            </Button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}
