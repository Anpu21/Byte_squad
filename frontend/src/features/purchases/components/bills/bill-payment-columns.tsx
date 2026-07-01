import { type DataTableColumn } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { ISupplierPayment } from '@/types';

/** Columns for the supplier's recent-payments table. */
export const PAYMENT_COLUMNS: DataTableColumn<ISupplierPayment>[] = [
    {
        key: 'number',
        header: '#',
        render: (p) => (
            <span className="text-[13px] text-text-1 mono">
                {p.paymentNumber}
            </span>
        ),
    },
    {
        key: 'date',
        header: 'Date',
        render: (p) => <span className="text-[13px] text-text-2">{p.paidAt}</span>,
    },
    {
        key: 'method',
        header: 'Method',
        render: (p) => <span className="text-[13px] text-text-2">{p.method}</span>,
    },
    {
        key: 'amount',
        header: 'Amount',
        align: 'right',
        numeric: true,
        render: (p) => (
            <span className="text-[13px] tabular-nums text-text-1">
                {formatCurrency(Number(p.amount))}
            </span>
        ),
    },
    {
        key: 'settled',
        header: 'Bills settled',
        align: 'right',
        numeric: true,
        render: (p) => (
            <span className="text-[13px] tabular-nums text-text-2">
                {p.allocations?.length ?? 0}
            </span>
        ),
    },
];
