import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerRequest } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatRequestDate } from '../lib/status-style';

interface MyRequestsCardListProps {
    requests: ICustomerRequest[];
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

export function MyRequestsCardList({
    requests,
    onView,
    onCancel,
}: MyRequestsCardListProps) {
    return (
        <div className="sm:hidden flex flex-col gap-3">
            {requests.map((req) => (
                <div
                    key={req.id}
                    className="bg-surface border border-border rounded-md p-4"
                >
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <Link
                            to={FRONTEND_ROUTES.SHOP_REQUEST_CONFIRMATION.replace(
                                ':code',
                                req.requestCode,
                            )}
                            className="text-accent-text hover:underline font-mono text-sm font-semibold"
                        >
                            {req.requestCode}
                        </Link>
                        <StatusBadge status={req.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <MetaCell
                            label="Date"
                            value={formatRequestDate(req.createdAt)}
                        />
                        <MetaCell
                            label="Branch"
                            value={req.branch?.name ?? '—'}
                        />
                        <MetaCell label="Items" value={req.items.length} />
                        <MetaCell
                            label="Total"
                            value={
                                <span className="font-medium">
                                    {formatCurrency(req.estimatedTotal)}
                                </span>
                            }
                        />
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => onView(req.id)}
                            aria-label={`View pickup request ${req.requestCode}`}
                            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-1 hover:text-primary transition-colors"
                        >
                            <Eye size={13} /> View QR & details
                        </button>
                        {req.status === 'pending' && (
                            <button
                                type="button"
                                onClick={() => onCancel(req.id)}
                                className="text-[12px] text-danger hover:underline"
                            >
                                Cancel request
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
