import { Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface RequestStatusActionsProps {
    requestId: string;
    isPending: boolean;
    canReview: boolean;
    actionPending?: boolean;
    onAccept: (id: string) => void | Promise<void>;
    onReject: (id: string) => void | Promise<void>;
}

export function RequestStatusActions({
    requestId,
    isPending,
    canReview,
    actionPending = false,
    onAccept,
    onReject,
}: RequestStatusActionsProps) {
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
                onClick={() => onAccept(requestId)}
                disabled={actionPending}
                className="w-full"
            >
                <Check size={14} />
                Accept request
            </Button>
            <Button
                variant="danger"
                size="md"
                onClick={() => onReject(requestId)}
                disabled={actionPending}
                className="w-full"
            >
                <X size={14} />
                Reject
            </Button>
        </div>
    );
}
