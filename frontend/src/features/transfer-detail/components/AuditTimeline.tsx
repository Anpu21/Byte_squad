import { TransferStatus } from '@/constants/enums';
import type { IStockTransferRequest } from '@/types';
import { AuditCard } from './AuditCard';

interface AuditTimelineProps {
    transfer: IStockTransferRequest;
}

function reviewLabel(status: IStockTransferRequest['status']): string {
    if (status === TransferStatus.REJECTED) return 'Rejected by';
    if (status === TransferStatus.CANCELLED) return 'Cancelled by';
    return 'Reviewed by';
}

export function AuditTimeline({ transfer }: AuditTimelineProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <AuditCard
                label="Requested by"
                user={transfer.requestedBy}
                timestamp={transfer.createdAt}
            />
            <AuditCard
                label={reviewLabel(transfer.status)}
                user={transfer.reviewedBy}
                timestamp={transfer.reviewedAt}
            />
            <AuditCard
                label="Shipped by"
                user={transfer.shippedBy}
                timestamp={transfer.shippedAt}
            />
            <AuditCard
                label="Received by"
                user={transfer.receivedBy}
                timestamp={transfer.receivedAt}
            />
        </div>
    );
}
