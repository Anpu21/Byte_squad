import { Search } from 'lucide-react';
import type { CustomerOrderStatus } from '@/types';

const INPUT_CLASS =
    'w-full h-10 px-3 bg-canvas border border-border rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors placeholder:text-text-3';

const STATUSES: CustomerOrderStatus[] = [
    'pending',
    'accepted',
    'completed',
    'rejected',
    'cancelled',
    'expired',
];

const STATUS_LABEL: Record<CustomerOrderStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

interface CustomerOrdersFilterProps {
    search: string;
    setSearch: (v: string) => void;
    statusFilter: CustomerOrderStatus | '';
    setStatusFilter: (v: CustomerOrderStatus | '') => void;
}

export function CustomerOrdersFilter({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
}: CustomerOrdersFilterProps) {
    return (
        <div className="px-5 py-4 border-b border-border bg-surface-2/40 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                />
                <label htmlFor="customer-orders-search" className="sr-only">
                    Search orders
                </label>
                <input
                    id="customer-orders-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search code or guest name…"
                    className={`${INPUT_CLASS} pl-9`}
                />
            </div>
            <select
                aria-label="Status filter"
                value={statusFilter}
                onChange={(e) =>
                    setStatusFilter(
                        e.target.value as CustomerOrderStatus | '',
                    )
                }
                className={`${INPUT_CLASS} sm:w-44`}
            >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                    <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                    </option>
                ))}
            </select>
        </div>
    );
}
