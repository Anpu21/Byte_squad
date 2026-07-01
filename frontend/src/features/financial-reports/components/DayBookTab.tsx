import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { accountingService } from '@/services/accounting.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IDayBookRow } from '@/types';
import { INPUT_CLASS } from '../financial-reports.lib';

const DAY_BOOK_COLUMNS: DataTableColumn<IDayBookRow>[] = [
    {
        key: 'time',
        header: 'Time',
        className: 'text-[12px] text-text-3 whitespace-nowrap',
        render: (r) => new Date(r.createdAt).toLocaleTimeString(),
    },
    {
        key: 'ref',
        header: 'Ref',
        className: 'text-[12px] text-text-2 mono',
        render: (r) => r.referenceNumber,
    },
    {
        key: 'account',
        header: 'Account',
        className: 'text-text-1',
        render: (r) =>
            r.accountCode ? `${r.accountCode} — ${r.accountName}` : '—',
    },
    {
        key: 'description',
        header: 'Description',
        className: 'text-[12px] text-text-2 max-w-[280px] truncate',
        render: (r) => r.description,
    },
    {
        key: 'debit',
        header: 'Debit',
        align: 'right',
        numeric: true,
        className: 'text-text-1',
        render: (r) => (r.entryType === 'debit' ? formatCurrency(r.amount) : '—'),
    },
    {
        key: 'credit',
        header: 'Credit',
        align: 'right',
        numeric: true,
        className: 'text-text-1',
        render: (r) =>
            r.entryType === 'credit' ? formatCurrency(r.amount) : '—',
    },
];

export function DayBookTab() {
    const [day, setDay] = useState('');
    const dayQuery = useQuery({
        queryKey: queryKeys.ledger.dayBook({ date: day || undefined }),
        queryFn: () => accountingService.getDayBook({ date: day || undefined }),
    });
    const book = dayQuery.data;

    return (
        <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                <input
                    className={`${INPUT_CLASS}${day ? '' : ' date-empty'}`}
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    aria-label="Day"
                />
                {book && (
                    <span className="ml-auto text-sm text-text-2 tabular-nums">
                        Dr {formatCurrency(book.totalDebits)} · Cr{' '}
                        {formatCurrency(book.totalCredits)} · {book.rows.length}{' '}
                        entries
                    </span>
                )}
            </div>
            <DataTable<IDayBookRow>
                columns={DAY_BOOK_COLUMNS}
                rows={book?.rows ?? []}
                getRowKey={(r) => r.id}
                isLoading={dayQuery.isLoading}
                zebra
                empty={<EmptyState title="No postings on this day." />}
            />
        </Card>
    );
}
