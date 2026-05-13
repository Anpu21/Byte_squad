import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loyaltyService } from '@/services/loyalty.service';
import { queryKeys } from '@/lib/queryKeys';

const DEFAULT_PAGE_SIZE = 20;

export function useLoyaltyHistory(pageSize = DEFAULT_PAGE_SIZE) {
    const [offset, setOffset] = useState(0);
    const query = useQuery({
        queryKey: queryKeys.loyalty.history({ limit: pageSize, offset }),
        queryFn: () =>
            loyaltyService.getHistory({ limit: pageSize, offset }),
    });

    return {
        ...query,
        offset,
        pageSize,
        loadMore: () => setOffset((o) => o + pageSize),
    };
}
