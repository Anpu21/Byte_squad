import { CalendarClock } from 'lucide-react';
import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import type { IExpiryReportRow } from '@/types';
import { ExpirySeverityPill } from './ExpirySeverityPill';
import { daysLabel } from '../lib/severity';

interface ExpiryTableProps {
    rows: IExpiryReportRow[];
    isLoading: boolean;
}

const columns: DataTableColumn<IExpiryReportRow>[] = [
    {
        key: 'product',
        header: 'Product',
        render: (r) => (
            <div>
                <div className="text-[13px] font-medium text-text-1">
                    {r.productName}
                </div>
                <div className="text-[11px] text-text-3">{r.barcode}</div>
            </div>
        ),
    },
    {
        key: 'batch',
        header: 'Batch',
        className: 'text-text-2',
        render: (r) => r.batchNo ?? '—',
    },
    {
        key: 'branch',
        header: 'Branch',
        className: 'text-text-2',
        render: (r) => r.branchName,
    },
    {
        key: 'expiry',
        header: 'Expiry',
        numeric: true,
        className: 'text-text-1 whitespace-nowrap',
        render: (r) => r.expiryDate,
    },
    {
        key: 'daysLeft',
        header: 'Days left',
        align: 'right',
        numeric: true,
        className: 'text-text-2 whitespace-nowrap',
        render: (r) => daysLabel(r.daysToExpiry),
    },
    {
        key: 'qty',
        header: 'Qty',
        align: 'right',
        numeric: true,
        render: (r) => r.quantity,
    },
    {
        key: 'status',
        header: 'Status',
        render: (r) => <ExpirySeverityPill severity={r.severity} />,
    },
];

export function ExpiryTable({ rows, isLoading }: ExpiryTableProps) {
    return (
        <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.batchId}
            isLoading={isLoading}
            zebra
            empty={
                <EmptyState
                    icon={<CalendarClock size={20} />}
                    title="No expiring batches"
                    description="Nothing is due to expire within the selected window. Receive a batch with an expiry date to start tracking."
                />
            }
        />
    );
}
