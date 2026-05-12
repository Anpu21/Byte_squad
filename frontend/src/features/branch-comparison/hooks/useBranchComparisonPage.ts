import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { toInputDate, type MetricKey } from '../lib/format';

interface SubmittedFilters {
    branchIds: string[];
    startDate: string;
    endDate: string;
}

export function useBranchComparisonPage() {
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
    });

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(toInputDate(sevenDaysAgo));
    const [endDate, setEndDate] = useState(toInputDate(today));
    const [metric, setMetric] = useState<MetricKey>('revenue');
    const [submitted, setSubmitted] = useState<SubmittedFilters | null>(null);

    const toggleBranch = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const handleRun = () => {
        if (selectedIds.length < 1) return;
        setSubmitted({
            branchIds: selectedIds,
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(`${endDate}T23:59:59.999`).toISOString(),
        });
    };

    const comparisonQuery = useQuery({
        queryKey: queryKeys.admin.comparison(submitted),
        queryFn: () => adminService.compareBranches(submitted!),
        enabled: submitted !== null,
    });

    const branches = useMemo(
        () => branchesQuery.data ?? [],
        [branchesQuery.data],
    );

    const chartData = useMemo(() => {
        if (!comparisonQuery.data) return [];
        return comparisonQuery.data.branches.map((b) => ({
            name: b.branchName,
            Revenue: b.revenue,
            Expenses: b.expenses,
        }));
    }, [comparisonQuery.data]);

    const selectedBranchNames = selectedIds
        .map((id) => branches.find((b) => b.id === id)?.name)
        .filter(Boolean) as string[];

    return {
        branches,
        selectedIds,
        toggleBranch,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        metric,
        setMetric,
        submitted,
        handleRun,
        comparison: comparisonQuery.data,
        isLoading: comparisonQuery.isLoading,
        isFetching: comparisonQuery.isFetching,
        chartData,
        selectedBranchNames,
    };
}
