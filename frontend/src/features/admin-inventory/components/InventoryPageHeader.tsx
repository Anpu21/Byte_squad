import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import type { IInventoryMatrixBranchColumn } from '@/types';
import type { ExportFormat } from '@/lib/exportUtils';
import ExportMenu from '@/components/common/ExportMenu';
import Button from '@/components/ui/Button';
import type { AdminInventoryFiltersState } from '../hooks/useAdminInventoryFilters';
import { exportInventoryRecords } from '../lib/export-records';

interface InventoryPageHeaderProps {
    total: number;
    branchCount: number;
    filters: AdminInventoryFiltersState;
    branches: IInventoryMatrixBranchColumn[];
}

export function InventoryPageHeader({
    total,
    branchCount,
    filters,
    branches,
}: InventoryPageHeaderProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: ExportFormat) => {
        const branchName = filters.branchId
            ? (branches.find((b) => b.id === filters.branchId)?.name ?? '')
            : '';
        try {
            setIsExporting(true);
            await exportInventoryRecords({
                filters: {
                    search: filters.search,
                    category: filters.category,
                    branchId: filters.branchId,
                    branchName,
                    stockStatus: filters.stockStatus,
                },
                user: user
                    ? { firstName: user.firstName, lastName: user.lastName }
                    : null,
                format,
            });
        } catch {
            toast.error('Could not generate export — please try again');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
                <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                    Inventory
                </p>
                <h1 className="text-3xl font-bold text-text-1 tracking-tight leading-none">
                    Products
                </h1>
                <p className="text-sm text-text-2 mt-1.5">
                    {total} {total === 1 ? 'product' : 'products'} across{' '}
                    {branchCount} {branchCount === 1 ? 'branch' : 'branches'}
                </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <ExportMenu
                    onExport={handleExport}
                    disabled={total === 0}
                    isPreparing={isExporting}
                />
                <Button
                    type="button"
                    onClick={() => navigate(FRONTEND_ROUTES.INVENTORY_ADD)}
                >
                    <Plus size={14} /> Add product
                </Button>
            </div>
        </div>
    );
}
