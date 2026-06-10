import { useQuery } from '@tanstack/react-query';
import { receivablesService } from '@/services/receivables.service';
import { queryKeys } from '@/lib/queryKeys';

/** Wraps `GET /pos/receivables/:userId/statement`. */
export function useCreditStatement(userId: string | null) {
    return useQuery({
        queryKey: queryKeys.receivables.statement(userId ?? ''),
        queryFn: () => receivablesService.statement(userId ?? ''),
        enabled: userId !== null,
    });
}
