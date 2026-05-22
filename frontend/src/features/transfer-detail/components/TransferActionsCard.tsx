import type { TransferPermissions } from '../lib/permissions';
import type { TransferAction } from '../types/transfer-action.type';

interface TransferActionsCardProps {
    permissions: TransferPermissions;
    onApprove: () => void;
    onChangeAction: (action: TransferAction) => void;
}

export function TransferActionsCard({
    permissions,
    onApprove,
    onChangeAction,
}: TransferActionsCardProps) {
    if (!permissions.hasAnyAction) return null;

    return (
        <div className="bg-surface border border-border rounded-md p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-3">
                Actions
            </p>
            <div className="flex flex-wrap items-center gap-3">
                {permissions.canApproveOrReject && (
                    <>
                        <button
                            type="button"
                            onClick={onApprove}
                            className="h-10 px-5 rounded-xl bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all"
                        >
                            Approve
                        </button>
                        <button
                            type="button"
                            onClick={() => onChangeAction('reject')}
                            className="h-10 px-5 rounded-xl bg-danger-soft border border-danger/40 text-danger text-sm font-medium hover:bg-danger-soft transition-colors"
                        >
                            Reject
                        </button>
                    </>
                )}
                {permissions.canShip && (
                    <button
                        type="button"
                        onClick={() => onChangeAction('ship')}
                        className="h-10 px-5 rounded-xl bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all"
                    >
                        Mark Shipped
                    </button>
                )}
                {permissions.canReceive && (
                    <button
                        type="button"
                        onClick={() => onChangeAction('receive')}
                        className="h-10 px-5 rounded-xl bg-accent-soft border border-accent/40 text-accent-text text-sm font-medium hover:bg-accent-soft transition-colors"
                    >
                        Mark Received
                    </button>
                )}
                {permissions.canCancel && (
                    <button
                        type="button"
                        onClick={() => onChangeAction('cancel')}
                        className="h-10 px-4 rounded-xl border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors"
                    >
                        Cancel transfer
                    </button>
                )}
            </div>
        </div>
    );
}
