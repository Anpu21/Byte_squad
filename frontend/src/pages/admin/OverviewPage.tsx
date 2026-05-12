import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IOverviewResponse } from '@/types';
import { OverviewSummaryCards } from '@/features/admin-overview/components/OverviewSummaryCards';
import { BranchPerformanceTable } from '@/features/admin-overview/components/BranchPerformanceTable';
import { OverviewAlerts } from '@/features/admin-overview/components/OverviewAlerts';

const REFETCH_INTERVAL = 30_000;

interface OverviewPageProps {
    embedded?: boolean;
}

export function OverviewPage({ embedded = false }: OverviewPageProps = {}) {
    const { data, isLoading } = useQuery<IOverviewResponse>({
        queryKey: queryKeys.admin.overview(),
        queryFn: adminService.getOverview,
        refetchInterval: REFETCH_INTERVAL,
    });

    if (isLoading || !data) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {!embedded && (
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                            System Overview
                        </h1>
                        <p className="text-sm text-text-2 mt-1">
                            All branches at a glance
                        </p>
                    </div>
                </div>
            )}

            <OverviewSummaryCards summary={data.summary} />
            <BranchPerformanceTable branches={data.branches} />
            <OverviewAlerts alerts={data.alerts} />
        </div>
    );
}
