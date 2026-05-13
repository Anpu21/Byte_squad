import { useInfiniteQuery } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';

const DEFAULT_PAGE_SIZE = 20;

export function useLoyaltyHistory(pageSize = DEFAULT_PAGE_SIZE) {
    return useInfiniteQuery({
        queryKey: ['loyalty', 'history', { limit: pageSize }],
        initialPageParam: 0,
        queryFn: ({ pageParam }) =>
            loyaltyService.getHistory({ limit: pageSize, offset: pageParam }),
        getNextPageParam: (last) => {
            const nextOffset = last.offset + last.limit;
            return nextOffset < last.total ? nextOffset : undefined;
        },
    });
}
