import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IEmployee, IEmployeePayload } from '@/types';

/**
 * Wraps `POST /hr/employees`. Invalidates the list family on success
 * so the new row pops into the table without an explicit refetch.
 */
export function useCreateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IEmployeePayload): Promise<IEmployee> =>
            hrService.createEmployee(payload),
        onSuccess: (created) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.hr.all() });
            queryClient.setQueryData(
                queryKeys.hr.employee(created.id),
                created,
            );
        },
    });
}
