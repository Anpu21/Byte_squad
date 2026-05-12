import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';
import ExportMenu from '@/components/common/ExportMenu';
import type { ExportFormat } from '@/lib/exportUtils';

interface InventoryListHeaderProps {
    total: number;
    isExporting: boolean;
    onExport: (format: ExportFormat) => void | Promise<void>;
}

export function InventoryListHeader({
    total,
    isExporting,
    onExport,
}: InventoryListHeaderProps) {
    const navigate = useNavigate();
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
                    {total} {total === 1 ? 'product' : 'products'} in your catalog
                </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <ExportMenu
                    onExport={onExport}
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
