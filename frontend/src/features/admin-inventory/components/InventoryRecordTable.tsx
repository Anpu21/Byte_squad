import { Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { FlatRecord } from '../types/flat-record.type';
import { InventoryRecordRow } from './InventoryRecordRow';

interface InventoryRecordTableProps {
    records: FlatRecord[];
    isLoading: boolean;
    hasActiveFilter: boolean;
    onResetFilters: () => void;
}

const HEADERS = [
    'Product',
    'Category',
    'Branch',
    'Status',
    'Quantity',
    'Price',
];

const COLUMN_COUNT = HEADERS.length + 1;

export function InventoryRecordTable({
    records,
    isLoading,
    hasActiveFilter,
    onResetFilters,
}: InventoryRecordTableProps) {
    return (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border text-[11px] uppercase tracking-widest text-text-3">
                            {HEADERS.map((h, i) => (
                                <th
                                    key={h}
                                    className={`px-4 py-3 font-semibold ${
                                        i >= 4 ? 'text-right' : ''
                                    }`}
                                >
                                    {h}
                                </th>
                            ))}
                            <th className="px-4 py-3 font-semibold text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-border">
                                    <td colSpan={COLUMN_COUNT} className="p-2">
                                        <div className="h-[44px] bg-surface-2 rounded-md animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : records.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={COLUMN_COUNT}
                                    className="px-6 py-16"
                                >
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
                                            ) : undefined
                                        }
                                    />
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => (
                                <InventoryRecordRow
                                    key={record.key}
                                    record={record}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
