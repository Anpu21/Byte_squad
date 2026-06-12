import { useState } from 'react';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/utils';
import { useSalesmanReport } from '../hooks/useSalesmanReport';
import { downloadSalesmanCsv } from '../lib/salesman-csv';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

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
            {!reportQuery.isLoading && rows.length === 0 ? (
                <EmptyState
                    title="No sales in this window"
                    description="Widen the date range or pick another branch."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-2/60 border-b border-border">
                            <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                <th className="px-3 py-2.5 font-medium">
                                    Cashier
                                </th>
                                <th className="px-3 py-2.5 font-medium text-right">
                                    Sales
                                </th>
                                <th className="px-3 py-2.5 font-medium text-right">
                                    Gross
                                </th>
                                <th className="px-3 py-2.5 font-medium text-right">
                                    Bill discount
                                </th>
                                <th className="px-3 py-2.5 font-medium text-right">
                                    Net
                                </th>
                                <th className="px-3 py-2.5 font-medium text-right">
                                    Voided
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.cashierId}
                                    className="border-b border-border hover:bg-surface-2/40 transition-colors"
                                >
                                    <td className="px-3 py-2.5 text-[13px] font-medium text-text-1">
                                        {row.cashierName}
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                        {row.salesCount}
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                        {formatCurrency(row.grossTotal)}
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                        {formatCurrency(row.discountTotal)}
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] font-medium text-text-1 text-right tabular-nums">
                                        {formatCurrency(row.netTotal)}
                                    </td>
                                    <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                        {row.voidedCount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {rows.length > 1 && (
                            <tfoot>
                                <tr className="bg-surface-2/40 text-[13px] font-medium text-text-1">
                                    <td className="px-3 py-2.5">Total</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {totals.salesCount}
                                    </td>
                                    <td className="px-3 py-2.5" colSpan={2} />
                                    <td className="px-3 py-2.5 text-right tabular-nums">
                                        {formatCurrency(totals.netTotal)}
                                    </td>
                                    <td className="px-3 py-2.5" />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}
        </Card>
    );
}
