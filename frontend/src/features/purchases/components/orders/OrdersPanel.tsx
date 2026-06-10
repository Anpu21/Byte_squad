import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Pill, { type PillTone } from '@/components/ui/Pill';
import EmptyState from '@/components/ui/EmptyState';
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
                {!ordersQuery.isLoading && rows.length === 0 ? (
                    <EmptyState
                        title="No purchase orders"
                        description="Raise an order to track what's due from each supplier — receiving it later pre-fills the GRN."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-2/60 border-b border-border">
                                <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                    <th className="px-3 py-2.5 font-medium">
                                        PO #
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Supplier
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Branch
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Expected
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Items
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Value
                                    </th>
                                    <th className="px-3 py-2.5 font-medium">
                                        Status
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((order) => {
                                    const isOpen =
                                        order.status === 'Draft' ||
                                        order.status === 'Sent';
                                    return (
                                        <tr
                                            key={order.id}
                                            className="border-b border-border hover:bg-surface-2/40 transition-colors"
                                        >
                                            <td className="px-3 py-2.5 text-[13px] font-medium text-text-1 mono">
                                                {order.poNumber}
                                            </td>
                                            <td className="px-3 py-2.5 text-[13px] text-text-1">
                                                {order.supplier?.name ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-[13px] text-text-2">
                                                {order.branch?.name ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-[13px] text-text-2 whitespace-nowrap">
                                                {order.expectedDate ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                                {order.items?.length ?? 0}
                                            </td>
                                            <td className="px-3 py-2.5 text-[13px] text-text-1 text-right tabular-nums">
                                                {formatCurrency(
                                                    Number(order.totalValue),
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Pill
                                                    tone={
                                                        STATUS_TONE[
                                                            order.status
                                                        ]
                                                    }
                                                >
                                                    {order.status}
                                                </Pill>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="inline-flex gap-1.5">
                                                    {order.status ===
                                                        'Draft' && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() =>
                                                                void run(
                                                                    send.mutateAsync(
                                                                        order.id,
                                                                    ),
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
                                                            onClick={() =>
                                                                onReceive(
                                                                    order,
                                                                )
                                                            }
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
                                                                    cancel.mutateAsync(
                                                                        order.id,
                                                                    ),
                                                                    `${order.poNumber} cancelled`,
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            <OrderFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
            />
        </>
    );
}
