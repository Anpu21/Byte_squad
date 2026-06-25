import { Link } from 'react-router-dom';
import { LuEye as Eye } from 'react-icons/lu';
import { DataTable, type DataTableColumn } from '@/components/ui';
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

export function MyOrdersTable({ requests, onView, onCancel }: MyOrdersTableProps) {
    const columns: DataTableColumn<ICustomerOrder>[] = [
        {
            key: 'code',
            header: 'Code',
            render: (req) => (
                <Link
                    to={FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
                        ':code',
                        req.orderCode,
                    )}
                    className="text-accent-text hover:underline font-mono text-xs"
                >
                    {req.orderCode}
                </Link>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            className: 'text-text-2',
            render: (req) => formatOrderDate(req.createdAt),
        },
        {
            key: 'branch',
            header: 'Branch',
            render: (req) => req.branch?.name ?? '—',
        },
        {
            key: 'items',
            header: 'Items',
            className: 'text-text-2',
            render: (req) => req.items.length,
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            render: (req) => (
                <>
                    <span className="font-medium text-text-1">
                        {formatCurrency(req.finalTotal)}
                    </span>
                    {req.loyaltyDiscountAmount > 0 && (
                        <span className="block text-[10px] text-accent">
                            -{formatCurrency(req.loyaltyDiscountAmount)} points
                        </span>
                    )}
                </>
            ),
        },
        {
            key: 'order',
            header: 'Order',
            render: (req) => <StatusBadge status={req.status} />,
        },
        {
            key: 'payment',
            header: 'Payment',
            render: (req) => <PaymentStatusBadge status={req.paymentStatus} />,
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (req) => (
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
                    {req.status === 'pending' && req.paymentStatus !== 'paid' && (
                        <button
                            type="button"
                            onClick={() => onCancel(req.id)}
                            className="text-[11px] text-danger hover:underline"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="hidden sm:block bg-surface border border-border rounded-md overflow-hidden">
            <DataTable
                columns={columns}
                rows={requests}
                getRowKey={(req) => req.id}
                zebra
            />
        </div>
    );
}
