import { LuSearch as Search } from 'react-icons/lu';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { CustomerOrderStatus } from '@/types';
import { STAFF_ORDER_STATUS_LABEL } from '../lib/order-status';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} w-full h-10 px-3`;

// Collection-oriented filter set; the legacy accepted/rejected states are no
// longer produced, so they aren't offered as filters.
const STATUSES: CustomerOrderStatus[] = [
    'pending',
    'completed',
    'not_collected',
    'cancelled',
];

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
                    className={`${FIELD_SHELL} ${FIELD_BORDER} w-full h-10 pl-9 pr-3`}
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
                        {STAFF_ORDER_STATUS_LABEL[s]}
                    </option>
                ))}
            </select>
        </div>
    );
}
