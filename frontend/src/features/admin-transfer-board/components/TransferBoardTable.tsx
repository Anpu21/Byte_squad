import { useNavigate } from 'react-router-dom';
import { LuArrowRight as ArrowRight } from 'react-icons/lu';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import {
    Button,
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { IStockTransferRequest } from '@/types';
import { boardActionsForStatus } from '../lib/board-card-actions';
import { useBoardAction } from '../context/board-action-context';

interface TransferBoardTableProps {
    rows: IStockTransferRequest[];
    isLoading: boolean;
}

/**
 * The transfer action list: each row shows product, route, qty + status and
 * the explicit actions allowed in that status (Approve/Reject/Ship/Receive/
 * Cancel). Actions reuse the shared modal flow via the board action context.
 */
export function TransferBoardTable({ rows, isLoading }: TransferBoardTableProps) {
    const navigate = useNavigate();
    const openAction = useBoardAction();

    const columns: DataTableColumn<IStockTransferRequest>[] = [
        {
            key: 'product',
            header: 'Product',
            className: 'text-text-1 font-medium',
            render: (t) => t.product?.name ?? '—',
        },
        {
            key: 'route',
            header: 'Route',
            render: (t) => (
                <span className="inline-flex items-center gap-1.5 text-xs text-text-2">
                    {t.sourceBranch?.name ?? (
                        <span className="text-text-3 italic">No source</span>
                    )}
                    <ArrowRight size={13} className="text-text-3 flex-shrink-0" />
                    <span className="text-text-1 font-medium">
                        {t.destinationBranch?.name ?? '—'}
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
            render: (t) => t.approvedQuantity ?? t.requestedQuantity,
        },
        {
            key: 'status',
            header: 'Status',
            render: (t) => <TransferStatusPill status={t.status} />,
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (t) => {
                const actions = boardActionsForStatus(t.status);
                return (
                    <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {actions.length > 0 && openAction ? (
                            actions.map((a) => (
                                <Button
                                    key={a.action}
                                    size="sm"
                                    variant={a.variant}
                                    onClick={() => openAction(t, a.action)}
                                >
                                    {a.label}
                                </Button>
                            ))
                        ) : (
                            <span className="text-xs text-text-3">—</span>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(t) => t.id}
                isLoading={isLoading}
                zebra
                onRowClick={(t) =>
                    navigate(
                        FRONTEND_ROUTES.TRANSFER_DETAIL.replace(':id', t.id),
                    )
                }
                getRowLabel={(t) =>
                    `View transfer of ${t.product?.name ?? 'product'}`
                }
                empty={
                    <EmptyState
                        title="Nothing here right now"
                        description="Transfers in this stage will appear here."
                    />
                }
            />
        </div>
    );
}
