import { ArrowRight } from 'lucide-react';
import { TransferStatus } from '@/constants/enums';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import {
    Button,
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import { formatTimeAgo } from '@/lib/format-time-ago';
import type { IStockTransferRequest } from '@/types';
import type { ScopeTab } from '../hooks/useTransferRequestsPage';

type ListScopeTab = Exclude<ScopeTab, 'history'>;

interface TransferRequestsTableProps {
    tab: ListScopeTab;
    items: IStockTransferRequest[];
    isLoading: boolean;
    shippingId: string | null;
    onShip: (item: IStockTransferRequest) => void;
    receivingId: string | null;
    onReceive: (item: IStockTransferRequest) => void;
    onRowClick: (id: string) => void;
}

export function TransferRequestsTable({
    tab,
    items,
    isLoading,
    shippingId,
    onShip,
    receivingId,
    onReceive,
    onRowClick,
}: TransferRequestsTableProps) {
    const columns: DataTableColumn<IStockTransferRequest>[] = [
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
                    {item.sourceBranch?.name ?? (
                        <span className="text-text-3 italic">No source</span>
                    )}
                    <ArrowRight size={13} className="text-text-3 flex-shrink-0" />
                    <span className="text-text-1 font-medium">
                        {item.destinationBranch?.name ?? '—'}
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
            key: 'status',
            header: 'Status',
            render: (item) => <TransferStatusPill status={item.status} />,
        },
        {
            key: 'requested',
            header: 'Requested',
            align: 'right',
            className: 'text-text-3 whitespace-nowrap',
            render: (item) => formatTimeAgo(item.createdAt),
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (item) => {
                const canShip =
                    tab === 'incoming' &&
                    item.status === TransferStatus.APPROVED;
                const canReceive =
                    tab === 'my-requests' &&
                    item.status === TransferStatus.IN_TRANSIT;
                return (
                    <>
                        {canShip && (
                            <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShip(item);
                                }}
                                disabled={shippingId === item.id}
                            >
                                {shippingId === item.id
                                    ? 'Shipping…'
                                    : 'Mark shipped'}
                            </Button>
                        )}
                        {canReceive && (
                            <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReceive(item);
                                }}
                                disabled={receivingId === item.id}
                            >
                                {receivingId === item.id
                                    ? 'Receiving…'
                                    : 'Mark received'}
                            </Button>
                        )}
                    </>
                );
            },
        },
    ];

    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <DataTable
                columns={columns}
                rows={items}
                getRowKey={(item) => item.id}
                onRowClick={(item) => onRowClick(item.id)}
                getRowLabel={(item) => `View transfer of ${item.product.name}`}
                isLoading={isLoading}
                zebra
                empty={
                    <EmptyState
                        title={
                            tab === 'my-requests'
                                ? 'No transfer requests yet'
                                : 'No incoming transfers'
                        }
                        description={
                            tab === 'my-requests'
                                ? 'Create one when your branch needs stock from another branch.'
                                : 'Approved transfers from other branches will appear here.'
                        }
                    />
                }
            />
        </div>
    );
}
