import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useInventory } from '@/hooks/useInventory';
import type { ExportFormat } from '@/lib/exportUtils';
import { useInventoryDelete } from './useInventoryDelete';
import { exportInventoryRows } from '../lib/export-rows';
import type { StockKey } from '../types/stock-key.type';

export function useInventoryListPage() {
    const { user } = useAuth();
    const inventory = useInventory();
    const deleteProduct = useInventoryDelete();
    const [isExporting, setIsExporting] = useState(false);

    const hasActiveFilter =
        inventory.search !== '' ||
        inventory.category !== '' ||
        inventory.stockStatus !== '';

    const resetFilters = () => {
        inventory.setSearch('');
        inventory.setCategory('');
        inventory.setStockStatus('');
    };

    const handleExport = async (format: ExportFormat) => {
        if (!user?.branchId) {
            // Admins are not tied to a branch — point them at the cross-branch
            // matrix view instead of letting the export silently no-op.
            toast.error(
                'This export is per-branch. Use the admin inventory matrix at /admin/inventory for a cross-branch view.',
            );
            return;
        }
        try {
            setIsExporting(true);
            await exportInventoryRows({
                branchId: user.branchId,
                filters: {
                    search: inventory.search,
                    category: inventory.category,
                    stockStatus: inventory.stockStatus as '' | StockKey,
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

    return {
        inventory,
        hasActiveFilter,
        resetFilters,
        handleExport,
        isExporting,
        deleteProduct,
    };
}
