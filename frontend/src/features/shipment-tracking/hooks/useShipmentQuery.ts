import { useQuery } from '@tanstack/react-query';
import { shipmentsService } from '@/services/shipments.service';
import { queryKeys } from '@/lib/queryKeys';

export function useShipmentQuery(id: string) {
    return useQuery({
        queryKey: queryKeys.shipments.detail(id),
        queryFn: () => shipmentsService.getById(id),
        enabled: Boolean(id),
    });
}
