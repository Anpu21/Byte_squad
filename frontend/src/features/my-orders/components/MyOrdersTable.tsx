import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerOrder } from '@/types';
import { StatusBadge } from './StatusBadge';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { formatOrderDate } from '../lib/status-style';

interface MyOrdersTableProps {
    requests: ICustomerOrder[];
    onView: (id: string) => void;
    onCancel: (id: string) => void;
}

export function MyOrdersTable({
    requests,
    onView,
    onCancel,
}: MyOrdersTableProps) {
    return (
        <div className="hidden sm:block bg-surface border border-border rounded-md overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-surface border-b border-border">
                    <tr className="text-[11px] uppercase tracking-widest text-text-3">
                        <th className="px-4 py-3 font-semibold">Code</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Branch</th>
                        <th className="px-4 py-3 font-semibold">Items</th>
                        <th className="px-4 py-3 font-semibold text-right">
                            Total
                        </th>
                        <th className="px-4 py-3 font-semibold">Order</th>
                        <th className="px-4 py-3 font-semibold">Payment</th>
                        <th className="px-4 py-3 font-semibold w-32"></th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {requests.map((req) => (
                        <tr
                            key={req.id}
                            className="border-b border-border hover:bg-surface-2 transition-colors"
                        >
                            <td className="px-4 py-3">
                                <Link
                                    to={FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
                                        ':code',
                                        req.orderCode,
                                    )}
                                    className="text-accent-text hover:underline font-mono text-xs"
                                >
                                    {req.orderCode}
                                </Link>
                            </td>
                            <td className="px-4 py-3 text-text-2 text-[13px]">
                                {formatOrderDate(req.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-text-1">
                                {req.branch?.name ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-text-2">
                                {req.items.length}
                            </td>
                            <td className="px-4 py-3 text-text-1 font-medium text-right">
                                {formatCurrency(req.finalTotal)}
                                {req.loyaltyDiscountAmount > 0 && (
                                    <span className="block text-[10px] text-accent">
                                        -{formatCurrency(req.loyaltyDiscountAmount)} points
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <StatusBadge status={req.status} />
                            </td>
                            <td className="px-4 py-3">
                                <PaymentStatusBadge
                                    status={req.paymentStatus}
                                />
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => onView(req.id)}
                                        aria-label={`View pickup order ${req.orderCode}`}
                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-text-2 hover:text-text-1 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20 rounded px-1"
                                    >
                                        <Eye size={12} />
                                        View
                                    </button>
                                    {req.status === 'pending' &&
                                        req.paymentStatus !== 'paid' && (
                                        <button
                                            type="button"
                                            onClick={() => onCancel(req.id)}
                                            className="text-[11px] text-danger hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
