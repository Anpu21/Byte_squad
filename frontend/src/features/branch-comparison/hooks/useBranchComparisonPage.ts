import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IBranchComparisonEntry } from '@/types';
import {
    toInputDate,
    formatCurrencyWhole,
    type MetricKey,
} from '../lib/format';
import {
    PRESET_LABELS,
    resolvePreset,
    type PresetKey,
} from '../lib/preset-ranges';

interface SubmittedFilters {
    branchIds: string[];
    startDate: string;
    endDate: string;
}

export interface LeaderboardRow {
    entry: IBranchComparisonEntry;
    rank: number;
    value: number;
    formattedValue: string;
    shareOfLeader: number;
    deltaPct: number;
    isLeader: boolean;
    margin: number;
}

const DEFAULT_PRESET: PresetKey = '7d';

function metricValue(entry: IBranchComparisonEntry, metric: MetricKey): number {
    switch (metric) {
        case 'revenue':
            return entry.revenue;
        case 'transactions':
            return entry.transactionCount;
        case 'aov':
            return entry.avgTransactionValue;
    }
}

function formatMetric(value: number, metric: MetricKey): string {
    if (metric === 'transactions') return value.toLocaleString();
    return formatCurrencyWhole(value);
}

export function useBranchComparisonPage() {
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
    });

    const initial = resolvePreset(DEFAULT_PRESET) ?? {
        start: new Date(),
        end: new Date(),
    };

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(toInputDate(initial.start));
    const [endDate, setEndDate] = useState(toInputDate(initial.end));
    const [metric, setMetric] = useState<MetricKey>('revenue');
    const [activePreset, setActivePreset] =
        useState<PresetKey>(DEFAULT_PRESET);
    const [submitted, setSubmitted] = useState<SubmittedFilters | null>(null);

    const toggleBranch = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const selectAllBranches = () => {
        setSelectedIds((branchesQuery.data ?? []).map((b) => b.id));
    };

    const clearBranches = () => setSelectedIds([]);

    const runWith = (ids: string[], start: string, end: string) => {
        if (ids.length < 1) return;
        setSubmitted({
            branchIds: ids,
            startDate: new Date(start).toISOString(),
            endDate: new Date(`${end}T23:59:59.999`).toISOString(),
        });
    };

    const handleRun = () => {
        runWith(selectedIds, startDate, endDate);
    };

    const setPreset = (key: PresetKey) => {
        setActivePreset(key);
        const r = resolvePreset(key);
        if (!r) return;
        const nextStart = toInputDate(r.start);
        const nextEnd = toInputDate(r.end);
        setStartDate(nextStart);
        setEndDate(nextEnd);
        if (selectedIds.length >= 1) {
            runWith(selectedIds, nextStart, nextEnd);
        }
    };

    const handleSetStartDate = (v: string) => {
        setStartDate(v);
        setActivePreset('custom');
    };

    const handleSetEndDate = (v: string) => {
        setEndDate(v);
        setActivePreset('custom');
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

    const leaderboard = useMemo<LeaderboardRow[]>(() => {
        if (!comparisonQuery.data) return [];
        const sorted = [...comparisonQuery.data.branches].sort(
            (a, b) => metricValue(b, metric) - metricValue(a, metric),
        );
        const leaderValue = sorted[0] ? metricValue(sorted[0], metric) : 0;
        return sorted.map((entry, idx) => {
            const value = metricValue(entry, metric);
            return {
                entry,
                rank: idx + 1,
                value,
                formattedValue: formatMetric(value, metric),
                shareOfLeader:
                    leaderValue > 0 ? value / leaderValue : 0,
                deltaPct:
                    leaderValue > 0 ? value / leaderValue - 1 : 0,
                isLeader: idx === 0,
                margin: entry.revenue - entry.expenses,
            };
        });
    }, [comparisonQuery.data, metric]);

    const totals = useMemo(() => {
        if (!comparisonQuery.data) {
            return { revenue: 0, expenses: 0, transactions: 0 };
        }
        return comparisonQuery.data.branches.reduce(
            (acc, b) => {
                acc.revenue += b.revenue;
                acc.expenses += b.expenses;
                acc.transactions += b.transactionCount;
                return acc;
            },
            { revenue: 0, expenses: 0, transactions: 0 },
        );
    }, [comparisonQuery.data]);

    const selectedBranchNames = selectedIds
        .map((id) => branches.find((b) => b.id === id)?.name)
        .filter(Boolean) as string[];

    const runIsStale = useMemo(() => {
        if (selectedIds.length < 1) return false;
        if (!submitted) return true;
        const sameIds =
            submitted.branchIds.length === selectedIds.length &&
            submitted.branchIds.every((id) => selectedIds.includes(id));
        const sameStart = submitted.startDate.startsWith(startDate);
        const sameEnd = submitted.endDate.startsWith(endDate);
        return !(sameIds && sameStart && sameEnd);
    }, [submitted, selectedIds, startDate, endDate]);

    return {
        branches,
        selectedIds,
        toggleBranch,
        selectAllBranches,
        clearBranches,
        startDate,
        setStartDate: handleSetStartDate,
        endDate,
        setEndDate: handleSetEndDate,
        metric,
        setMetric,
        activePreset,
        setPreset,
        presetLabels: PRESET_LABELS,
        submitted,
        handleRun,
        runIsStale,
        comparison: comparisonQuery.data,
        isLoading: comparisonQuery.isLoading,
        isFetching: comparisonQuery.isFetching,
        chartData,
        leaderboard,
        totals,
        selectedBranchNames,
    };
}
