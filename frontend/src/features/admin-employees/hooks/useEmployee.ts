import { useQuery } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Wraps `GET /hr/employees/:id`. Disabled until `id` is non-null so
 * the form page can render in create mode without ever firing this
 * query.
 */
export function useEmployee(id: string | null) {
    return useQuery({
        queryKey: queryKeys.hr.employee(id ?? ''),
        queryFn: () => hrService.getEmployee(id as string),
        enabled: Boolean(id),
        staleTime: 30_000,
    });
}
