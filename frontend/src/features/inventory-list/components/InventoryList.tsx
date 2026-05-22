import { useNavigate } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { IInventoryWithProduct } from '@/types';
import { InventoryRow } from './InventoryRow';

interface InventoryListProps {
    items: IInventoryWithProduct[];
    isLoading: boolean;
    hasActiveFilter: boolean;
    onResetFilters: () => void;
    onDelete: (item: IInventoryWithProduct) => void;
}

export function InventoryList({
    items,
    isLoading,
    hasActiveFilter,
    onResetFilters,
    onDelete,
}: InventoryListProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <ul className="flex flex-col gap-2">
                {[...Array(5)].map((_, i) => (
                    <li
                        key={i}
                        className="h-[68px] bg-surface-2 rounded-md animate-pulse"
                    />
                ))}
            </ul>
        );
    }

    if (items.length === 0) {
        return (
            <Card>
                <EmptyState
                    icon={<Package size={20} />}
                    title="No products found"
                    description={
                        hasActiveFilter
                            ? 'No products match the current filters.'
                            : 'Add your first product to start tracking inventory.'
                    }
                    action={
                        hasActiveFilter ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onResetFilters}
                                size="md"
                            >
                                Reset filters
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={() =>
                                    navigate(FRONTEND_ROUTES.INVENTORY_ADD)
                                }
                                size="md"
                            >
                                <Plus size={14} /> Add product
                            </Button>
                        )
                    }
                />
            </Card>
        );
    }

    return (
        <ul className="flex flex-col gap-2">
            {items.map((item) => (
                <li key={item.id}>
                    <InventoryRow item={item} onDelete={onDelete} />
                </li>
            ))}
        </ul>
    );
}
