import { Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface OrderStatusActionsProps {
    orderId: string;
    isPending: boolean;
    canReject: boolean;
    canReview: boolean;
    actionPending?: boolean;
    onAccept: (id: string) => void | Promise<void>;
    onReject: (id: string) => void | Promise<void>;
}

export function OrderStatusActions({
    orderId,
    isPending,
    canReject,
    canReview,
    actionPending = false,
    onAccept,
    onReject,
}: OrderStatusActionsProps) {
    if (!isPending) return null;

    if (!canReview) {
        return (
            <p className="mt-3 text-xs text-text-3 text-center">
                Only staff at this branch can accept or reject.
            </p>
        );
    }

    return (
        <div className="mt-4 flex flex-col gap-2">
            <Button
                variant="primary"
                size="md"
                onClick={() => onAccept(orderId)}
                disabled={actionPending}
                className="w-full"
            >
                <Check size={14} />
                Accept order
            </Button>
            {canReject && (
                <Button
                    variant="danger"
                    size="md"
                    onClick={() => onReject(orderId)}
                    disabled={actionPending}
                    className="w-full"
                >
                    <X size={14} />
                    Reject
                </Button>
            )}
        </div>
    );
}
