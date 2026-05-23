import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Fetches a single sale by id with the items / cashier / customer relations
 * eager-loaded by the backend. Used by the bill-preview modal when the
 * cashier picks a row out of `PosRecentSaleSidebar` — the row carries only
 * the summary fields, so we need a round-trip to render the receipt body.
 *
 * Disabled when `saleId` is null so opening the modal without a target
 * doesn't issue a noop request.
 */
export function usePosSaleById(saleId: string | null) {
    return useQuery({
        queryKey: queryKeys.pos.saleById(saleId ?? ''),
        queryFn: () => posService.findSaleById(saleId!),
        enabled: saleId !== null,
        staleTime: 30_000,
    });
}
