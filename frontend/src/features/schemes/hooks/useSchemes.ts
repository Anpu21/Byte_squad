import { useQuery } from '@tanstack/react-query';
import { discountSchemesService } from '@/services/discount-schemes.service';
import { queryKeys } from '@/lib/queryKeys';

/** Management list of discount schemes (admin: all branches; manager: own + global). */
export function useSchemes(isActive?: boolean) {
    return useQuery({
        queryKey: queryKeys.pos.schemes(isActive),
        queryFn: () => discountSchemesService.list(isActive),
        staleTime: 30_000,
    });
}
