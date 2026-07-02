import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { returnsService } from '@/services/returns.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IReturnsAnalyticsParams } from '@/types';

/** Returns dashboard analytics (role-scoped server-side). */
export function useReturnsAnalytics(params: IReturnsAnalyticsParams) {
    return useQuery({
        queryKey: queryKeys.returns.analytics(params),
        queryFn: () => returnsService.getAnalytics(params),
        placeholderData: keepPreviousData,
    });
}
