import { LuBan as Ban, LuCheck as Check } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import type { ICustomerOrder } from '@/types';
import { isAwaitingCollection } from '@/features/customer-orders/lib/order-status';

interface OrderStatusActionsProps {
    order: ICustomerOrder;
    canManage: boolean;
    actionPending?: boolean;
    onCollect: (order: ICustomerOrder) => void | Promise<void>;
    onMarkNotCollected: (id: string) => void | Promise<void>;
}

export function OrderStatusActions({
    order,
    canManage,
    actionPending = false,
    onCollect,
    onMarkNotCollected,
}: OrderStatusActionsProps) {
    if (!isAwaitingCollection(order.status)) return null;

    if (!canManage) {
        return (
            <p className="mt-3 text-xs text-text-3 text-center">
                Only staff at this branch can update this order.
            </p>
        );
    }

    const onlinePaid =
        order.paymentMode === 'online' && order.paymentStatus === 'paid';
    const canCollect = onlinePaid || order.paymentMode === 'manual';

    return (
        <div className="mt-4 flex flex-col gap-2">
            {canCollect && (
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => onCollect(order)}
                    disabled={actionPending}
                    className="w-full"
                >
                    <Check size={14} />
                    {order.paymentMode === 'manual'
                        ? 'Collect at POS'
                        : 'Mark collected'}
                </Button>
            )}
            <Button
                variant="danger"
                size="md"
                onClick={() => onMarkNotCollected(order.id)}
                disabled={actionPending}
                className="w-full"
            >
                <Ban size={14} />
                Not collected
            </Button>
        </div>
    );
}
