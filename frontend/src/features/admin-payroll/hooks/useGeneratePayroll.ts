import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    hrService,
    type IGeneratePayrollPayload,
} from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IGeneratePayrollResponse } from '@/types';

/**
 * Wraps `POST /hr/payroll/generate`. Invalidates the hr family so
 * the table refetches and the `skipped` warnings (if any) surface
 * via the mutation's return value to the caller.
 */
export function useGeneratePayroll() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            payload: IGeneratePayrollPayload,
        ): Promise<IGeneratePayrollResponse> =>
            hrService.generatePayroll(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.hr.all(),
            });
        },
    });
}
