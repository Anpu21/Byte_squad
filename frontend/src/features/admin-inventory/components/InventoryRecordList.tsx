import { useNavigate } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { FlatRecord } from '../types/flat-record.type';
import { InventoryRecordCard } from './InventoryRecordCard';

interface InventoryRecordListProps {
    records: FlatRecord[];
    isLoading: boolean;
    hasActiveFilter: boolean;
    onResetFilters: () => void;
}

export function InventoryRecordList({
    records,
    isLoading,
    hasActiveFilter,
    onResetFilters,
}: InventoryRecordListProps) {
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

    if (records.length === 0) {
        return (
            <Card>
                <EmptyState
                    icon={<Package size={20} />}
                    title="No inventory records found"
                    description={
                        hasActiveFilter
                            ? 'No records match the current filters.'
                            : 'No products in the catalog yet.'
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
            {records.map((record) => (
                <li key={record.key}>
                    <InventoryRecordCard record={record} />
                </li>
            ))}
        </ul>
    );
}
