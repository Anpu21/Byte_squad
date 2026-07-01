import {
    Button,
    Pill,
    type DataTableColumn,
    type PillTone,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IPurchaseOrder, PurchaseOrderStatus } from '@/types';

const STATUS_TONE: Record<PurchaseOrderStatus, PillTone> = {
    Draft: 'neutral',
    Sent: 'info',
    Received: 'success',
    Cancelled: 'danger',
};

interface IOrdersPanelColumnsParams {
    /** Hands the order to the New GRN tab pre-filled for receiving. */
    onReceive: (order: IPurchaseOrder) => void;
    /** Marks a Draft order as Sent. */
    onSend: (order: IPurchaseOrder) => void;
    /** Cancels an open (Draft/Sent) order. */
    onCancel: (order: IPurchaseOrder) => void;
}

/**
 * Column set for the purchase-order register table. Row-action handlers are
 * injected so the cells stay presentational while OrdersPanel owns the
 * mutation/toast wiring.
 */
export function buildOrdersPanelColumns({
    onReceive,
    onSend,
    onCancel,
}: IOrdersPanelColumnsParams): DataTableColumn<IPurchaseOrder>[] {
    return [
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
                                onClick={() => onSend(order)}
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
                                onClick={() => onCancel(order)}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];
}
