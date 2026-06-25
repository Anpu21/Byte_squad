import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LuPlus as Plus } from 'react-icons/lu';
import {
    Button,
    Card,
    DataTable,
    EmptyState,
    Pill,
    type DataTableColumn,
    type PillTone,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IPurchaseOrder, PurchaseOrderStatus } from '@/types';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { usePurchaseOrderMutations } from '../../hooks/usePurchaseOrderMutations';
import { OrderFormModal } from './OrderFormModal';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

const STATUS_TONE: Record<PurchaseOrderStatus, PillTone> = {
    Draft: 'neutral',
    Sent: 'info',
    Received: 'success',
    Cancelled: 'danger',
};

interface IOrdersPanelProps {
    /** Hands the order to the New GRN tab pre-filled for receiving. */
    onReceive: (order: IPurchaseOrder) => void;
}

/**
 * Purchase-order register: raise intent, mark Sent, cancel, or hand an
 * open order to the GRN entry to be received (which marks it Received).
 */
export function OrdersPanel({ onReceive }: IOrdersPanelProps) {
    const [status, setStatus] = useState<'' | PurchaseOrderStatus>('');
    const [formOpen, setFormOpen] = useState(false);
    const { send, cancel } = usePurchaseOrderMutations();

    const ordersQuery = usePurchaseOrders({
        status: status || undefined,
        limit: 100,
        offset: 0,
    });
    const rows = ordersQuery.data?.rows ?? [];

    async function run(action: Promise<unknown>, okMessage: string) {
        try {
            await action;
            toast.success(okMessage);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Action failed');
            } else {
                toast.error('Action failed');
            }
        }
    }

    const columns: DataTableColumn<IPurchaseOrder>[] = [
        {
            key: 'poNumber',
            header: 'PO #',
            className: 'font-medium mono',
            render: (order) => order.poNumber,
        },
        {
            key: 'supplier',
            header: 'Supplier',
            render: (order) => order.supplier?.name ?? '—',
        },
        {
            key: 'branch',
            header: 'Branch',
            className: 'text-text-2',
            render: (order) => order.branch?.name ?? '—',
        },
        {
            key: 'expected',
            header: 'Expected',
            className: 'text-text-2 whitespace-nowrap',
            render: (order) => order.expectedDate ?? '—',
        },
        {
            key: 'items',
            header: 'Items',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (order) => order.items?.length ?? 0,
        },
        {
            key: 'value',
            header: 'Value',
            align: 'right',
            numeric: true,
            render: (order) => formatCurrency(Number(order.totalValue)),
        },
        {
            key: 'status',
            header: 'Status',
            render: (order) => (
                <Pill tone={STATUS_TONE[order.status]}>{order.status}</Pill>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (order) => {
                const isOpen =
                    order.status === 'Draft' || order.status === 'Sent';
                return (
                    <div className="inline-flex gap-1.5">
                        {order.status === 'Draft' && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                    void run(
                                        send.mutateAsync(order.id),
                                        `${order.poNumber} marked Sent`,
                                    )
                                }
                            >
                                Send
                            </Button>
                        )}
                        {isOpen && (
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => onReceive(order)}
                            >
                                Receive
                            </Button>
                        )}
                        {isOpen && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                    void run(
                                        cancel.mutateAsync(order.id),
                                        `${order.poNumber} cancelled`,
                                    )
                                }
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                    <select
                        className={INPUT_CLASS}
                        value={status}
                        onChange={(e) =>
                            setStatus(
                                e.target.value as '' | PurchaseOrderStatus,
                            )
                        }
                        aria-label="Filter by status"
                    >
                        <option value="">All statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Received">Received</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <div className="ml-auto">
                        <Button
                            variant="primary"
                            onClick={() => setFormOpen(true)}
                        >
                            <Plus size={14} aria-hidden />
                            New order
                        </Button>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    rows={rows}
                    getRowKey={(order) => order.id}
                    isLoading={ordersQuery.isLoading}
                    zebra
                    empty={
                        <EmptyState
                            title="No purchase orders"
                            description="Raise an order to track what's due from each supplier — receiving it later pre-fills the GRN."
                        />
                    }
                />
            </Card>
            <OrderFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
            />
        </>
    );
}
