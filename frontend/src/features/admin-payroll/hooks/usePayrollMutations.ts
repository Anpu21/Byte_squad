import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    hrService,
    type IMarkPayrollPaidPayload,
} from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IPayroll } from '@/types';

function useInvalidateHr() {
    const queryClient = useQueryClient();
    return () =>
        void queryClient.invalidateQueries({
            queryKey: queryKeys.hr.all(),
        });
}

/** `PATCH /hr/payroll/:id/approve`. */
export function useApprovePayroll() {
    const invalidate = useInvalidateHr();
    return useMutation({
        mutationFn: (id: string): Promise<IPayroll> =>
            hrService.approvePayroll(id),
        onSuccess: invalidate,
    });
}

interface MarkPaidArgs {
    id: string;
    payload: IMarkPayrollPaidPayload;
}

/** `PATCH /hr/payroll/:id/mark-paid`. */
export function useMarkPayrollPaid() {
    const invalidate = useInvalidateHr();
    return useMutation({
        mutationFn: ({ id, payload }: MarkPaidArgs): Promise<IPayroll> =>
            hrService.markPayrollPaid(id, payload),
        onSuccess: invalidate,
    });
}

/** `PATCH /hr/payroll/:id/cancel`. */
export function useCancelPayroll() {
    const invalidate = useInvalidateHr();
    return useMutation({
        mutationFn: (id: string): Promise<IPayroll> =>
            hrService.cancelPayroll(id),
        onSuccess: invalidate,
    });
}
