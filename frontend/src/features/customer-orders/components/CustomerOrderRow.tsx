import { Check, Eye, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import StatusPill from '@/components/ui/StatusPill';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerOrder } from '@/types';
import { formatOrderDateTime } from '../lib/date-helpers';
import { PaymentStatusBadge } from '@/features/my-orders/components/PaymentStatusBadge';

interface CustomerOrderRowProps {
    request: ICustomerOrder;
    showBranchCol: boolean;
    canReview: boolean;
    actionPending: boolean;
    onView: (id: string) => void;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}

export function CustomerOrderRow({
    request: req,
    showBranchCol,
    canReview,
    actionPending,
    onView,
    onAccept,
    onReject,
}: CustomerOrderRowProps) {
    const customerName = req.user
        ? `${req.user.firstName} ${req.user.lastName}`
        : (req.guestName ?? 'Guest');

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
                <StatusPill status={req.status} />
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
                    {req.status === 'pending' && canReview && (
                        <>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onAccept(req.id)}
                                disabled={actionPending}
                            >
                                <Check size={12} />
                                Accept
                            </Button>
                            {req.paymentStatus !== 'paid' && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => onReject(req.id)}
                                    disabled={actionPending}
                                >
                                    <X size={12} />
                                    Reject
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}
