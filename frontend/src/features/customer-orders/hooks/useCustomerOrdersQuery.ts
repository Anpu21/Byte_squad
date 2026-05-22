import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerOrdersService } from '@/services/customer-orders.service';
import { queryKeys } from '@/lib/queryKeys';
import type { CustomerOrderStatus } from '@/types';

const REFETCH_INTERVAL_MS = 30000;

export function useCustomerOrdersQuery() {
    const [statusFilter, setStatusFilter] = useState<
        CustomerOrderStatus | ''
    >('');
    const [search, setSearch] = useState('');

    const query = useQuery({
        queryKey: queryKeys.customerOrders.list({ statusFilter, search }),
        queryFn: () =>
            customerOrdersService.listForStaff({
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
