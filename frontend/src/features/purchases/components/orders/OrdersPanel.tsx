import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LuPlus as Plus } from 'react-icons/lu';
import {
    Button,
    Card,
    DataTable,
    EmptyState,
    FIELD_SHELL,
    FIELD_BORDER,
} from '@/components/ui';
import type { IPurchaseOrder, PurchaseOrderStatus } from '@/types';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { usePurchaseOrderMutations } from '../../hooks/usePurchaseOrderMutations';
import { OrderFormModal } from './OrderFormModal';
import { buildOrdersPanelColumns } from './orders-panel-columns';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

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

    const columns = buildOrdersPanelColumns({
        onReceive,
        onSend: (order) =>
            void run(
                send.mutateAsync(order.id),
                `${order.poNumber} marked Sent`,
            ),
        onCancel: (order) =>
            void run(
                cancel.mutateAsync(order.id),
                `${order.poNumber} cancelled`,
            ),
    });

    return (
        <>
            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
                    <select
                        className={`${INPUT_CLASS} field-select`}
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
                    clientPaginate={{ unit: 'orders' }}
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
