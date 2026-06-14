import { useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersService } from '@/services/suppliers.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ISupplierUpdatePayload } from '@/types';

/** `PATCH /suppliers/:id` — invalidates the purchases namespace on success. */
export function useUpdateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { id: string; payload: ISupplierUpdatePayload }) =>
            suppliersService.update(input.id, input.payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.purchases.all(),
            });
        },
    });
}
