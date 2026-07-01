import Card from '@/components/ui/Card';
import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IPayablesAgeingRow, IPayablesOutstandingRow } from '@/types';
import { usePayablesAgeing } from '../../hooks/usePayablesAgeing';
import { usePayablesOutstanding } from '../../hooks/usePayablesOutstanding';

const OUTSTANDING_COLUMNS: DataTableColumn<IPayablesOutstandingRow>[] = [
    {
        key: 'supplier',
        header: 'Supplier',
        render: (r) => r.supplierName,
    },
    {
        key: 'openingRemaining',
        header: 'Opening left',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (r) => formatCurrency(r.openingRemaining),
    },
    {
        key: 'billsTotal',
        header: 'Bills',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (r) => formatCurrency(r.billsTotal),
    },
    {
        key: 'billsPaid',
        header: 'Paid',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (r) => formatCurrency(r.billsPaid),
    },
    {
        key: 'totalOutstanding',
        header: 'Outstanding',
        align: 'right',
        numeric: true,
        className: 'font-semibold text-text-1',
        render: (r) => formatCurrency(r.totalOutstanding),
    },
];

const AGEING_COLUMNS: DataTableColumn<IPayablesAgeingRow>[] = [
    {
        key: 'supplier',
        header: 'Supplier',
        render: (r) => r.supplierName,
    },
    {
        key: 'current',
        header: 'Current',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (r) => formatCurrency(r.current),
    },
    {
        key: 'd1to30',
        header: '1–30d',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (r) => formatCurrency(r.d1to30),
    },
    {
        key: 'd31to60',
        header: '31–60d',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (r) => formatCurrency(r.d31to60),
    },
    {
        key: 'd61to90',
        header: '61–90d',
        align: 'right',
        numeric: true,
        className: 'text-warning',
        render: (r) => formatCurrency(r.d61to90),
    },
    {
        key: 'd90plus',
        header: '90d+',
        align: 'right',
        numeric: true,
        className: 'text-danger',
        render: (r) => formatCurrency(r.d90plus),
    },
    {
        key: 'total',
        header: 'Total',
        align: 'right',
        numeric: true,
        className: 'font-semibold text-text-1',
        render: (r) => formatCurrency(r.total),
    },
];

/**
 * Payables position: per-supplier outstanding (opening + bills − payments)
 * and the ageing of unpaid bill remainders by days overdue.
 */
export function AgeingPanel() {
    const outstandingQuery = usePayablesOutstanding();
    const ageingQuery = usePayablesAgeing();

    const outstanding = (outstandingQuery.data ?? []).filter(
        (r) => r.totalOutstanding > 0,
    );
    const ageing = ageingQuery.data ?? [];

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border text-[12px] uppercase tracking-wide text-text-3">
                    Outstanding by supplier
                </div>
                <DataTable
                    columns={OUTSTANDING_COLUMNS}
                    rows={outstanding}
                    getRowKey={(r) => r.supplierId}
                    isLoading={outstandingQuery.isLoading}
                    zebra
                    clientPaginate={{ unit: 'suppliers' }}
                    empty={
                        <EmptyState
                            title="Nothing outstanding"
                            description="Every supplier bill and opening balance is settled."
                        />
                    }
                />
            </Card>

            <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border text-[12px] uppercase tracking-wide text-text-3">
                    Ageing — unpaid bills by days overdue
                </div>
                <DataTable
                    columns={AGEING_COLUMNS}
                    rows={ageing}
                    getRowKey={(r) => r.supplierId}
                    isLoading={ageingQuery.isLoading}
                    zebra
                    clientPaginate={{ unit: 'suppliers' }}
                    empty={
                        <EmptyState
                            title="No unpaid bills"
                            description="Ageing buckets appear once a GRN bill goes past its credit terms."
                        />
                    }
                />
            </Card>
        </div>
    );
}
