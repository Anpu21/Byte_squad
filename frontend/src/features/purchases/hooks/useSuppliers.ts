import { useQuery } from '@tanstack/react-query';
import {
    suppliersService,
    type IListSuppliersQuery,
} from '@/services/suppliers.service';
import { queryKeys } from '@/lib/queryKeys';

/** Wraps `GET /suppliers` — empty filter strings are stripped off the wire. */
export function useSuppliers(args: IListSuppliersQuery = {}) {
    const params: IListSuppliersQuery = {
        search: args.search?.trim() || undefined,
        status: args.status || undefined,
        limit: args.limit,
        offset: args.offset,
    };
    return useQuery({
        queryKey: queryKeys.purchases.suppliers(params),
        queryFn: () => suppliersService.list(params),
        staleTime: 15_000,
    });
}
