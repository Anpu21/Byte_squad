import { useState } from 'react';
import { LuDownload as Download } from 'react-icons/lu';
import { useQuery } from '@tanstack/react-query';
import {
    Button,
    Card,
    DataTable,
    EmptyState,
    FIELD_SHELL,
    FIELD_BORDER,
    type DataTableColumn,
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/utils';
import type { ISalesmanReportRow } from '@/types';
import { useSalesmanReport } from '../hooks/useSalesmanReport';
import { downloadSalesmanCsv } from '../lib/salesman-csv';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

function isoDaysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
}

/**
 * Cashier-wise sales for a date window — count, gross, bill discount,
 * net, voids — with a CSV export. Managers see their branch; admins can
 * filter by branch or view all.
 */
export function SalesmanReportPanel() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const [startDate, setStartDate] = useState(() => isoDaysAgo(29));
    const [endDate, setEndDate] = useState(() => isoDaysAgo(0));
    const [branchId, setBranchId] = useState('');

    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
        enabled: isAdmin,
    });
    const reportQuery = useSalesmanReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branchId: branchId || undefined,
    });
    const rows = reportQuery.data?.rows ?? [];
    const totals = rows.reduce(
        (acc, row) => ({
            salesCount: acc.salesCount + row.salesCount,
            netTotal: acc.netTotal + row.netTotal,
        }),
        { salesCount: 0, netTotal: 0 },
    );

    const columns: DataTableColumn<ISalesmanReportRow>[] = [
        {
            key: 'cashier',
            header: 'Cashier',
            className: 'font-medium',
            render: (row) => row.cashierName,
        },
        {
            key: 'sales',
            header: 'Sales',
            align: 'right',
            className: 'text-text-2 tabular-nums',
            render: (row) => row.salesCount,
        },
        {
            key: 'gross',
            header: 'Gross',
            align: 'right',
            className: 'text-text-2 tabular-nums',
            render: (row) => formatCurrency(row.grossTotal),
        },
        {
            key: 'discount',
            header: 'Bill discount',
            align: 'right',
            className: 'text-text-2 tabular-nums',
            render: (row) => formatCurrency(row.discountTotal),
        },
        {
            key: 'net',
            header: 'Net',
            align: 'right',
            className: 'font-medium tabular-nums',
            render: (row) => formatCurrency(row.netTotal),
        },
        {
            key: 'voided',
            header: 'Voided',
            align: 'right',
            className: 'text-text-2 tabular-nums',
            render: (row) => row.voidedCount,
        },
    ];

    return (
        <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                <label className="flex items-center gap-1.5 text-[12px] text-text-3">
                    From
                    <input
                        className={INPUT_CLASS}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        aria-label="Report start date"
                    />
                </label>
                <label className="flex items-center gap-1.5 text-[12px] text-text-3">
                    To
                    <input
                        className={INPUT_CLASS}
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        aria-label="Report end date"
                    />
                </label>
                {isAdmin && (
                    <select
                        className={INPUT_CLASS}
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        aria-label="Filter by branch"
                    >
                        <option value="">All branches</option>
                        {(branchesQuery.data ?? []).map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                )}
                <div className="ml-auto">
                    <Button
                        variant="secondary"
                        onClick={() =>
                            downloadSalesmanCsv(rows, startDate, endDate)
                        }
                        disabled={rows.length === 0}
                    >
                        <Download size={14} aria-hidden />
                        CSV
                    </Button>
                </div>
            </div>
            <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.cashierId}
                isLoading={reportQuery.isLoading}
                zebra
                empty={
                    <EmptyState
                        title="No sales in this window"
                        description="Widen the date range or pick another branch."
                    />
                }
                footerRow={
                    rows.length > 1 ? (
                        <tr className="text-[13px] font-medium text-text-1">
                            <td className="px-4 py-2.5">Total</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">
                                {totals.salesCount}
                            </td>
                            <td className="px-4 py-2.5" colSpan={2} />
                            <td className="px-4 py-2.5 text-right tabular-nums">
                                {formatCurrency(totals.netTotal)}
                            </td>
                            <td className="px-4 py-2.5" />
                        </tr>
                    ) : undefined
                }
            />
        </Card>
    );
}
