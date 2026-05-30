import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    hrService,
    type ITerminateEmployeePayload,
} from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IEmployee } from '@/types';

interface TerminateEmployeeArgs {
    id: string;
    payload: ITerminateEmployeePayload;
}

/**
 * Wraps `PATCH /hr/employees/:id/terminate`. Admin-only on the BE;
 * the FE just surfaces a 403 toast via the axios interceptor if a
 * manager hits the button.
 */
export function useTerminateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: TerminateEmployeeArgs): Promise<IEmployee> =>
            hrService.terminateEmployee(id, payload),
        onSuccess: (terminated) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.hr.all() });
            queryClient.setQueryData(
                queryKeys.hr.employee(terminated.id),
                terminated,
            );
        },
    });
}
