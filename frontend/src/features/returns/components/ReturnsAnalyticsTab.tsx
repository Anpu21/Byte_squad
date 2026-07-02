import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    LuUndo2 as Undo2,
    LuHandCoins as HandCoins,
    LuPackageCheck as PackageCheck,
    LuTriangleAlert as TriangleAlert,
} from 'react-icons/lu';
import KpiCard from '@/components/ui/KpiCard';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui';
import AreaChart from '@/components/charts/AreaChart';
import BarChart from '@/components/charts/BarChart';
import { ChartCard } from '@/components/charts/ChartCard';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { IReturnsAnalyticsParams } from '@/types';
import { useReturnsAnalytics } from '../hooks/useReturnsAnalytics';

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}
function daysAgoIso(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}
function shortDay(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

export function ReturnsAnalyticsTab() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const isCashier = user?.role === UserRole.CASHIER;

    const [startDate, setStartDate] = useState(() => daysAgoIso(29));
    const [endDate, setEndDate] = useState(() => todayIso());
    const [branchId, setBranchId] = useState('');

    const branchesQuery = useQuery({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        enabled: isAdmin,
        staleTime: 5 * 60_000,
    });

    const params: IReturnsAnalyticsParams = useMemo(
        () => ({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            branchId: isAdmin && branchId ? branchId : undefined,
        }),
        [startDate, endDate, branchId, isAdmin],
    );

    const { data, isLoading, isError } = useReturnsAnalytics(params);
    const totals = data?.totals;
    const dash = isLoading ? '—' : '0';

    const trendData = (data?.trend ?? []).map((t) => ({
        name: shortDay(t.date),
        value: t.totalRefunded,
    }));
    const cashierData = (data?.byCashier ?? []).map((c) => ({
        name: c.cashierName,
        value: c.totalRefunded,
    }));
    const branchData = (data?.byBranch ?? []).map((b) => ({
        name: b.branchName,
        value: b.totalRefunded,
    }));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        From
                    </label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-auto"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-text-2 mb-1.5">
                        To
                    </label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-auto"
                    />
                </div>
                {isAdmin && (
                    <div>
                        <label className="block text-xs font-medium text-text-2 mb-1.5">
                            Branch
                        </label>
                        <Select
                            value={branchId}
                            onChange={setBranchId}
                            aria-label="Filter by branch"
                            options={[
                                { label: 'All branches', value: '' },
                                ...(branchesQuery.data ?? []).map((b) => ({
                                    label: b.name,
                                    value: b.id,
                                })),
                            ]}
                        />
                    </div>
                )}
            </div>

            {isError && (
                <div className="px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    Could not load returns analytics. Please try again.
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    label="Returns"
                    value={totals ? totals.returnsCount.toLocaleString() : dash}
                    icon={<Undo2 size={16} />}
                    accent="info"
                />
                <KpiCard
                    label="Refunded"
                    value={totals ? formatCurrency(totals.totalRefunded) : dash}
                    icon={<HandCoins size={16} />}
                    accent="danger"
                />
                <KpiCard
                    label="Restocked value"
                    value={totals ? formatCurrency(totals.restockedValue) : dash}
                    icon={<PackageCheck size={16} />}
                    accent="accent"
                />
                <KpiCard
                    label="Damaged units"
                    value={totals ? totals.damagedQty.toLocaleString() : dash}
                    icon={<TriangleAlert size={16} />}
                    accent="warning"
                />
            </div>

            <ChartCard
                title="Refunds over time"
                description="Total refunded per day in the selected window."
            >
                {trendData.length > 0 ? (
                    <AreaChart
                        data={trendData}
                        color="var(--danger)"
                        formatValue={formatCurrency}
                    />
                ) : (
                    <EmptyState
                        title={isLoading ? 'Loading…' : 'No returns in range'}
                        description="Refund activity will appear here."
                    />
                )}
            </ChartCard>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {!isCashier && (
                    <ChartCard
                        title="Refunds by cashier"
                        description="Who processed the most refunds."
                    >
                        {cashierData.length > 0 ? (
                            <BarChart
                                data={cashierData}
                                color="var(--primary)"
                                formatValue={formatCurrency}
                            />
                        ) : (
                            <EmptyState
                                title={isLoading ? 'Loading…' : 'No data'}
                                description="Per-cashier refunds appear here."
                            />
                        )}
                    </ChartCard>
                )}
                {isAdmin && (
                    <ChartCard
                        title="Refunds by branch"
                        description="Refund totals across branches."
                    >
                        {branchData.length > 0 ? (
                            <BarChart
                                data={branchData}
                                color="var(--info)"
                                formatValue={formatCurrency}
                            />
                        ) : (
                            <EmptyState
                                title={isLoading ? 'Loading…' : 'No data'}
                                description="Per-branch refunds appear here."
                            />
                        )}
                    </ChartCard>
                )}
            </div>
        </div>
    );
}
