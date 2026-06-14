import { useQuery } from '@tanstack/react-query';
import { shipmentsService } from '@/services/shipments.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IListShipmentsParams } from '@/types';

/** Branch/courier-scoped shipment list (server derives scope from the JWT). */
export function useShipmentsQuery(params: IListShipmentsParams = {}) {
    return useQuery({
        queryKey: queryKeys.shipments.list(params),
        queryFn: () => shipmentsService.list(params),
        staleTime: 15_000,
    });
}
