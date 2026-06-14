import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discountSchemesService } from '@/services/discount-schemes.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IDiscountSchemePayload } from '@/types';

/**
 * Create / update / delete a discount scheme. Every success invalidates
 * both the management list and the till's active-rules cache so an edit
 * reaches open POS sessions on their next refetch.
 */
export function useSchemeMutations() {
    const queryClient = useQueryClient();

    const invalidate = () => {
        void queryClient.invalidateQueries({
            queryKey: queryKeys.pos.schemesAll(),
        });
        void queryClient.invalidateQueries({
            queryKey: queryKeys.pos.activeSchemes(),
        });
    };

    const create = useMutation({
        mutationFn: (payload: IDiscountSchemePayload) =>
            discountSchemesService.create(payload),
        onSuccess: invalidate,
    });

    const update = useMutation({
        mutationFn: (input: {
            id: string;
            payload: Partial<IDiscountSchemePayload>;
        }) => discountSchemesService.update(input.id, input.payload),
        onSuccess: invalidate,
    });

    const remove = useMutation({
        mutationFn: (id: string) => discountSchemesService.remove(id),
        onSuccess: invalidate,
    });

    return { create, update, remove };
}
