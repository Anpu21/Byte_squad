import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerRequestsService } from '@/services/customer-requests.service';
import { queryKeys } from '@/lib/queryKeys';
import type { CustomerRequestStatus } from '@/types';

const REFETCH_INTERVAL_MS = 30000;

export function useCustomerRequestsQuery() {
    const [statusFilter, setStatusFilter] = useState<
        CustomerRequestStatus | ''
    >('');
    const [search, setSearch] = useState('');

    const query = useQuery({
        queryKey: queryKeys.customerRequests.list({ statusFilter, search }),
        queryFn: () =>
            customerRequestsService.listForStaff({
                status: statusFilter || undefined,
                q: search.trim() || undefined,
            }),
        refetchInterval: REFETCH_INTERVAL_MS,
    });

    return {
        requests: query.data ?? [],
        isLoading: query.isLoading,
        statusFilter,
        setStatusFilter,
        search,
        setSearch,
    };
}
