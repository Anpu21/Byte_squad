import { LuBookOpen as BookOpen } from 'react-icons/lu';
import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { LedgerEntryWithBalance } from '../lib/compute-balance';

interface LedgerTableProps {
    entries: LedgerEntryWithBalance[];
    isLoading: boolean;
    hasFilters: boolean;
}

const columns: DataTableColumn<LedgerEntryWithBalance>[] = [
    {
        key: 'date',
        header: 'Date',
        numeric: true,
        className: 'text-xs text-text-2 whitespace-nowrap',
        render: (e) =>
            new Date(e.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
    },
    {
        key: 'ref',
        header: 'Reference',
        numeric: true,
        className: 'text-xs whitespace-nowrap',
        render: (e) => e.referenceNumber,
    },
    {
        key: 'desc',
        header: 'Description',
        render: (e) => e.description,
    },
    {
        key: 'debit',
        header: 'Debit',
        align: 'right',
        numeric: true,
        render: (e) =>
            e.entryType === 'debit' ? (
                <span className="text-text-1 font-medium">
                    {formatCurrency(Number(e.amount))}
                </span>
            ) : (
                <span className="text-text-3">—</span>
            ),
    },
    {
        key: 'credit',
        header: 'Credit',
        align: 'right',
        numeric: true,
        render: (e) =>
            e.entryType === 'credit' ? (
                <span className="text-accent-text font-medium">
                    {formatCurrency(Number(e.amount))}
                </span>
            ) : (
                <span className="text-text-3">—</span>
            ),
    },
    {
        key: 'balance',
        header: 'Balance',
        align: 'right',
        numeric: true,
        className: 'font-semibold',
        render: (e) => (
            <span className={e.balance >= 0 ? 'text-text-1' : 'text-danger'}>
                {formatCurrency(e.balance)}
            </span>
        ),
    },
];

export function LedgerTable({ entries, isLoading, hasFilters }: LedgerTableProps) {
    return (
        <DataTable
            columns={columns}
            rows={entries}
            getRowKey={(e) => e.id}
            isLoading={isLoading}
            zebra
            empty={
                <EmptyState
                    icon={<BookOpen size={20} />}
                    title="No ledger entries found"
                    description={
                        hasFilters
                            ? 'No entries match your current filters. Try adjusting your search.'
                            : 'Ledger entries will appear here when POS sales or expenses are recorded.'
                    }
                />
            }
        />
    );
}
