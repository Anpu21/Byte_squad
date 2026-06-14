import { useQuery } from '@tanstack/react-query';
import { shiftsService } from '@/services/shifts.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * The acting cashier's open shift + live drawer summary. Refetched on a
 * short interval so the "expected cash" the close modal shows stays
 * close to reality without manual refreshes.
 */
export function useCurrentShift() {
    return useQuery({
        queryKey: queryKeys.shifts.current(),
        queryFn: shiftsService.current,
        staleTime: 10_000,
        refetchInterval: 60_000,
    });
}
