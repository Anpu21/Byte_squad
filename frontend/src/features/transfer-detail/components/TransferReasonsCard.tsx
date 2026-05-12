import type { IStockTransferRequest } from '@/types';

interface TransferReasonsCardProps {
    transfer: IStockTransferRequest;
}

export function TransferReasonsCard({ transfer }: TransferReasonsCardProps) {
    if (
        !transfer.requestReason &&
        !transfer.rejectionReason &&
        !transfer.approvalNote
    ) {
        return null;
    }

    return (
        <div className="bg-surface border border-border rounded-md p-6 mb-6 space-y-4">
            {transfer.requestReason && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-1">
                        Request reason
                    </p>
                    <p className="text-sm text-text-1">
                        {transfer.requestReason}
                    </p>
                </div>
            )}
            {transfer.approvalNote && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-text mb-1">
                        Admin verification message
                    </p>
                    <p className="text-sm text-text-1">
                        {transfer.approvalNote}
                    </p>
                </div>
            )}
            {transfer.rejectionReason && (
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-danger mb-1">
                        Rejection reason
                    </p>
                    <p className="text-sm text-text-1">
                        {transfer.rejectionReason}
                    </p>
                </div>
            )}
        </div>
    );
}
