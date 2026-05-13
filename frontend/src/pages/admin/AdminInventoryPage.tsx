import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdminInventoryFilters } from '@/features/admin-inventory/hooks/useAdminInventoryFilters';
import { useAdminInventoryMatrixQuery } from '@/features/admin-inventory/hooks/useAdminInventoryMatrixQuery';
import { useInventoryCategoriesQuery } from '@/features/admin-inventory/hooks/useInventoryCategoriesQuery';
import { useFlatRecords } from '@/features/admin-inventory/hooks/useFlatRecords';
import { InventoryPageHeader } from '@/features/admin-inventory/components/InventoryPageHeader';
import { InventoryFilterRail } from '@/features/admin-inventory/components/InventoryFilterRail';
import { InventoryHeroKpi } from '@/features/admin-inventory/components/InventoryHeroKpi';
import { ActiveFilterChips } from '@/features/admin-inventory/components/ActiveFilterChips';
import { InventoryRecordTable } from '@/features/admin-inventory/components/InventoryRecordTable';
import { InventoryPagination } from '@/features/admin-inventory/components/InventoryPagination';

interface AdminInventoryPageProps {
    embedded?: boolean;
}

export function AdminInventoryPage({
    embedded = false,
}: AdminInventoryPageProps) {
    const filters = useAdminInventoryFilters();
    const matrixQuery = useAdminInventoryMatrixQuery(filters.serverParams);
    const categoriesQuery = useInventoryCategoriesQuery();
    const records = useFlatRecords(matrixQuery.data, filters);

    useEffect(() => {
        if (matrixQuery.error) toast.error('Could not load inventory.');
    }, [matrixQuery.error]);

    const branches = matrixQuery.data?.branches ?? [];
    const total = matrixQuery.data?.total ?? 0;

    return (
        <div
            className={
                embedded
                    ? ''
                    : 'animate-in fade-in slide-in-from-bottom-4 duration-500'
            }
        >
            {!embedded && (
                <InventoryPageHeader
                    total={total}
                    branchCount={branches.length}
                    filters={filters}
                    branches={branches}
                />
            )}

            <div className="flex flex-col lg:flex-row gap-5">
                <InventoryFilterRail
                    branches={branches}
                    categories={categoriesQuery.data ?? []}
                    filters={filters}
                />

                <div className="flex-1 min-w-0">
                    <InventoryHeroKpi
                        productCount={total}
                        branchCount={branches.length}
                        outOfStockCount={records.outOfStockCount}
                    />
                    <ActiveFilterChips
                        filters={filters}
                        branches={branches}
                        recordCount={records.list.length}
                    />
                    <InventoryRecordTable
                        records={records.list}
                        isLoading={matrixQuery.isLoading}
                        hasActiveFilter={filters.hasActiveFilter}
                        onResetFilters={filters.resetFilters}
                    />
                    <InventoryPagination
                        page={matrixQuery.data?.page ?? 1}
                        totalPages={matrixQuery.data?.totalPages ?? 1}
                        total={total}
                        limit={filters.serverParams.limit}
                        onPageChange={filters.setPage}
                    />
                </div>
            </div>
        </div>
    );
}
