import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { inventoryService } from '@/services/inventory.service';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import { UserRole } from '@/constants/enums';
import type { IBranchWithMeta, IProduct } from '@/types';
import { useTransferHistoryFilters } from './useTransferHistoryFilters';

export function useTransferHistoryPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const filters = useTransferHistoryFilters(isAdmin);

    const productsQuery = useQuery<IProduct[]>({
        queryKey: queryKeys.product.all(),
        queryFn: inventoryService.getProducts,
    });

    const branchesQuery = useQuery<IBranchWithMeta[]>({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        enabled: isAdmin,
    });

    const products = useMemo(
        () => productsQuery.data ?? [],
        [productsQuery.data],
    );
    const branches = useMemo(
        () => branchesQuery.data ?? [],
        [branchesQuery.data],
    );

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === filters.productId) ?? null,
        [products, filters.productId],
    );

    return {
        isAdmin,
        filters,
        products,
        branches,
        selectedProduct,
    };
}
