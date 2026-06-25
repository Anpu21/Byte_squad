import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IStockTransferRequest } from '@/types';
import { formatDuration, formatHistoryDate, terminalAt } from '../lib/format';

interface TransferHistoryTableProps {
    items: IStockTransferRequest[];
    isLoading: boolean;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const columns: DataTableColumn<IStockTransferRequest>[] = [
    {
        key: 'status',
        header: 'Status',
        render: (item) => <TransferStatusPill status={item.status} />,
    },
    {
        key: 'product',
        header: 'Product',
        className: 'text-text-1 font-medium',
        render: (item) => item.product.name,
    },
    {
        key: 'route',
        header: 'Route',
        render: (item) => (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-2">
                {item.sourceBranch?.name ?? '—'}
                <ArrowRight size={13} className="text-text-3 flex-shrink-0" />
                <span className="text-text-1 font-medium">
                    {item.destinationBranch.name}
                </span>
            </span>
        ),
    },
    {
        key: 'qty',
        header: 'Qty',
        align: 'right',
        numeric: true,
        className: 'text-text-1 font-medium',
        render: (item) => item.approvedQuantity ?? item.requestedQuantity,
    },
    {
        key: 'requester',
        header: 'Requester',
        className: 'text-text-2',
        render: (item) =>
            item.requestedBy
                ? `${item.requestedBy.firstName} ${item.requestedBy.lastName}`.trim()
                : '—',
    },
    {
        key: 'closedAt',
        header: 'Closed at',
        className: 'text-text-3 whitespace-nowrap',
        render: (item) => formatHistoryDate(terminalAt(item)),
    },
    {
        key: 'duration',
        header: 'Duration',
        align: 'right',
        numeric: true,
        className: 'text-text-3 whitespace-nowrap',
        render: (item) => formatDuration(item.createdAt, terminalAt(item)),
    },
];

export function TransferHistoryTable({
    items,
    isLoading,
    hasActiveFilters,
    onClearFilters,
    page,
    totalPages,
    onPageChange,
}: TransferHistoryTableProps) {
    const navigate = useNavigate();

    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <DataTable
                columns={columns}
                rows={items}
                getRowKey={(item) => item.id}
                onRowClick={(item) =>
                    navigate(
                        FRONTEND_ROUTES.TRANSFER_DETAIL.replace(':id', item.id),
                    )
                }
                getRowLabel={(item) => `View transfer of ${item.product.name}`}
                isLoading={isLoading}
                zebra
                empty={
                    <EmptyState
                        title="No transfers in this range"
                        action={
                            hasActiveFilters ? (
                                <button
                                    type="button"
                                    onClick={onClearFilters}
                                    className="text-xs text-text-3 hover:text-text-1 transition-colors underline"
                                >
                                    Clear filters
                                </button>
                            ) : undefined
                        }
                    />
                }
                footer={
                    !isLoading && items.length > 0 && totalPages > 1 ? (
                        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-3 bg-surface-2">
                            <span>
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => onPageChange(page - 1)}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null
                }
            />
        </div>
    );
}
