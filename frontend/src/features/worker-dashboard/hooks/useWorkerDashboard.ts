import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import type { IAttendance } from '@/types';
import {
    computeMetrics,
    startOfMonthIso,
    toIsoDate,
    type WorkerAttendanceMetrics,
} from '@/features/worker-dashboard/lib/attendance-metrics';

function describeError(err: unknown): string {
    if (
        axios.isAxiosError(err) &&
        typeof err.response?.data?.message === 'string'
    ) {
        return err.response.data.message;
    }
    return 'Could not record attendance';
}

interface UseWorkerDashboardResult {
    user: ReturnType<typeof useAuth>['user'];
    rows: IAttendance[];
    metrics: WorkerAttendanceMetrics;
    isLoading: boolean;
    isError: boolean;
    isMutating: boolean;
    checkIn: () => void;
    checkOut: () => void;
}

/**
 * Worker-dashboard page model. Fetches the signed-in worker's own
 * month-to-date attendance via `GET /hr/attendance/me`, derives the
 * KPIs, and exposes self check-in / check-out. The check-in/out
 * mutations invalidate the whole `hr` cache family so this view and
 * any manager grid open elsewhere both refresh.
 */
export function useWorkerDashboard(): UseWorkerDashboardResult {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const now = useMemo(() => new Date(), []);

    const range = useMemo(
        () => ({ startDate: startOfMonthIso(now), endDate: toIsoDate(now) }),
        [now],
    );

    const query = useQuery({
        queryKey: queryKeys.hr.myAttendance(range),
        queryFn: () => hrService.getMyAttendance(range),
        staleTime: 30_000,
    });

    const rows = useMemo(() => query.data?.rows ?? [], [query.data]);
    const metrics = useMemo(() => computeMetrics(rows, now), [rows, now]);

    const invalidate = () =>
        void queryClient.invalidateQueries({ queryKey: queryKeys.hr.all() });

    const checkInMutation = useMutation({
        mutationFn: () => hrService.checkInSelf(),
        onSuccess: (row) => {
            invalidate();
            toast.success(`Clocked in at ${row.checkInTime?.slice(0, 5) ?? 'now'}`);
        },
        onError: (err) => toast.error(describeError(err)),
    });

    const checkOutMutation = useMutation({
        mutationFn: () => hrService.checkOutSelf(),
        onSuccess: (row) => {
            invalidate();
            toast.success(
                `Clocked out at ${row.checkOutTime?.slice(0, 5) ?? 'now'}`,
            );
        },
        onError: (err) => toast.error(describeError(err)),
    });

    return {
        user,
        rows,
        metrics,
        isLoading: query.isLoading,
        isError: query.isError,
        isMutating: checkInMutation.isPending || checkOutMutation.isPending,
        checkIn: () => checkInMutation.mutate(),
        checkOut: () => checkOutMutation.mutate(),
    };
}
