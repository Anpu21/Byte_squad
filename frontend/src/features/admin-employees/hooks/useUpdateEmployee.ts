import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IEmployee, IEmployeePayload } from '@/types';

interface UpdateEmployeeArgs {
    id: string;
    payload: Partial<IEmployeePayload>;
}

/**
 * Wraps `PATCH /hr/employees/:id`. Invalidates both the list family
 * and the byId entry so any open detail view re-renders with the
 * latest data.
 */
export function useUpdateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: UpdateEmployeeArgs): Promise<IEmployee> =>
            hrService.updateEmployee(id, payload),
        onSuccess: (updated) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.hr.all() });
            queryClient.setQueryData(
                queryKeys.hr.employee(updated.id),
                updated,
            );
        },
    });
}
