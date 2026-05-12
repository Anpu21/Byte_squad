import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import type { IInventoryMatrixResponse } from '@/types';
import {
    queryKeys,
    type AdminInventoryMatrixFilters,
} from '@/lib/queryKeys';

const STALE_MS = 60_000; // 1 minute — inventory changes from real POS activity

export function useAdminInventoryMatrixQuery(
    filters: AdminInventoryMatrixFilters,
) {
    return useQuery<IInventoryMatrixResponse>({
        queryKey: queryKeys.admin.inventoryMatrix(filters),
        queryFn: () => adminService.getInventoryMatrix(filters),
        staleTime: STALE_MS,
    });
}
