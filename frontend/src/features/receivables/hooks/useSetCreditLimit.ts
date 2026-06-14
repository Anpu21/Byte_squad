import { useMutation, useQueryClient } from '@tanstack/react-query';
import { receivablesService } from '@/services/receivables.service';
import { queryKeys } from '@/lib/queryKeys';

/** `PATCH /pos/receivables/:userId/credit-limit` (null = unlimited). */
export function useSetCreditLimit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { userId: string; creditLimit: number | null }) =>
            receivablesService.setCreditLimit(input.userId, input.creditLimit),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.receivables.all(),
            });
        },
    });
}
