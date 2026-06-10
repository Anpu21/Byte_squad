import { useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersService } from '@/services/suppliers.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ISupplierPayload } from '@/types';

/** `POST /suppliers` — invalidates the purchases namespace on success. */
export function useCreateSupplier() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ISupplierPayload) =>
            suppliersService.create(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.purchases.all(),
            });
        },
    });
}
