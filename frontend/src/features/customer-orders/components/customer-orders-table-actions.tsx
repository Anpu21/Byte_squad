import {
    LuBan as Ban,
    LuCheck as Check,
    LuEye as Eye,
} from 'react-icons/lu';
import { Button } from '@/components/ui';
import type { ICustomerOrder } from '@/types';
import { isAwaitingCollection } from '../lib/order-status';

interface CustomerOrdersTableActionsProps {
    order: ICustomerOrder;
    actionPending: boolean;
    canManage: (branchId: string) => boolean;
    onView: (id: string) => void;
    onCollect: (order: ICustomerOrder) => void;
    onMarkNotCollected: (id: string) => void;
}

// Row-actions cell: view link plus branch-scoped collection controls.
export function CustomerOrdersTableActions({
    order,
    actionPending,
    canManage,
    onView,
    onCollect,
    onMarkNotCollected,
}: CustomerOrdersTableActionsProps) {
    const awaiting = isAwaitingCollection(order.status);
    // Online pre-paid orders collect in one click; pay-at-pickup
    // orders take payment at the POS (onCollect routes there).
    // Online-but-unpaid orders aren't collectable yet, so no Collect
    // action is offered.
    const onlinePaid =
        order.paymentMode === 'online' && order.paymentStatus === 'paid';
    const canCollect = onlinePaid || order.paymentMode === 'manual';

    return (
        <div className="flex justify-end items-center gap-2">
            <button
                type="button"
                onClick={() => onView(order.id)}
                aria-label={`View pickup order ${order.orderCode}`}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-text-2 hover:text-text-1 transition-colors focus:outline-none focus:ring-[3px] focus:ring-focus/25 rounded px-2 py-1"
            >
                <Eye size={12} />
                View
            </button>
            {awaiting && canManage(order.branchId) && (
                <>
                    {canCollect && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onCollect(order)}
                            disabled={actionPending}
                        >
                            <Check size={12} />
                            Collect
                        </Button>
                    )}
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onMarkNotCollected(order.id)}
                        disabled={actionPending}
                    >
                        <Ban size={12} />
                        Not collected
                    </Button>
                </>
            )}
        </div>
    );
}
