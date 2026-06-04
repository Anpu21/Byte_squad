import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Drives the admin/manager dashboard page. The server applies branch
 * scoping based on the JWT for managers, so no params are passed. The
 * cache stays fresh for 30s; on a new sale the create-sale mutation
 * invalidates this key for immediate dashboard refresh.
 */
export function useAdminDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.pos.adminDashboard(),
    queryFn: () => posService.getAdminDashboard(),
    staleTime: 30_000,
  });
}
