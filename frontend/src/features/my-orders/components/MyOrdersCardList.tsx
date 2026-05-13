import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerOrder } from '@/types';
import { StatusBadge } from './StatusBadge';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { formatOrderDate } from '../lib/status-style';

interface MyOrdersCardListProps {
    requests: ICustomerOrder[];
    onView: (id: string) => void;
    onCancel: (id: string) => void;
}

function MetaCell({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className="text-text-3 uppercase tracking-widest text-[10px]">
                {label}
            </p>
            <p className="text-text-1 mt-0.5">{value}</p>
        </div>
    );
}

export function MyOrdersCardList({
    requests,
    onView,
    onCancel,
}: MyOrdersCardListProps) {
    return (
        <div className="sm:hidden flex flex-col gap-3">
            {requests.map((req) => (
                <div
                    key={req.id}
                    className="bg-surface border border-border rounded-md p-4"
                >
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <Link
                            to={FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
                                ':code',
                                req.orderCode,
                            )}
                            className="text-accent-text hover:underline font-mono text-sm font-semibold"
                        >
                            {req.orderCode}
                        </Link>
                        <div className="flex flex-col items-end gap-1">
                            <StatusBadge status={req.status} />
                            <PaymentStatusBadge status={req.paymentStatus} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <MetaCell
                            label="Date"
                            value={formatOrderDate(req.createdAt)}
                        />
                        <MetaCell
                            label="Branch"
                            value={req.branch?.name ?? '—'}
                        />
                        <MetaCell label="Items" value={req.items.length} />
                        <MetaCell
                            label="Total"
                            value={
                                <span>
                                    <span className="font-medium">
                                        {formatCurrency(req.finalTotal)}
                                    </span>
                                    {req.loyaltyDiscountAmount > 0 && (
                                        <span className="block text-[10px] text-accent">
                                            -{formatCurrency(req.loyaltyDiscountAmount)}
                                        </span>
                                    )}
                                </span>
                            }
                        />
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => onView(req.id)}
                            aria-label={`View pickup order ${req.orderCode}`}
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-1 hover:text-primary transition-colors"
                        >
                            <Eye size={13} /> View QR & details
                        </button>
                        {req.status === 'pending' &&
                            req.paymentStatus !== 'paid' && (
                            <button
                                type="button"
                                onClick={() => onCancel(req.id)}
                                className="text-[12px] text-danger hover:underline"
                            >
                                Cancel order
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
