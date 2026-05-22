import { TransferStatus } from '@/constants/enums';

const LABELS: Record<TransferStatus, string> = {
    [TransferStatus.PENDING]: 'Pending',
    [TransferStatus.APPROVED]: 'Approved',
    [TransferStatus.REJECTED]: 'Rejected',
    [TransferStatus.IN_TRANSIT]: 'In Transit',
    [TransferStatus.COMPLETED]: 'Completed',
    [TransferStatus.CANCELLED]: 'Cancelled',
};

const STYLES: Record<TransferStatus, string> = {
    [TransferStatus.PENDING]:
        'bg-primary-soft text-text-1 border-border-strong',
    [TransferStatus.APPROVED]:
        'bg-transparent text-text-1 border-primary/40',
    [TransferStatus.REJECTED]:
        'bg-danger-soft text-danger border-danger/40 border-dashed',
    [TransferStatus.IN_TRANSIT]:
        'bg-warning-soft text-warning border-warning/40',
    [TransferStatus.COMPLETED]:
        'bg-accent-soft text-accent-text border-accent/40',
    [TransferStatus.CANCELLED]:
        'bg-transparent text-text-3 border-border border-dashed',
};

export default function TransferStatusPill({
    status,
}: {
    status: TransferStatus;
}) {
    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium border ${STYLES[status]}`}
        >
            {LABELS[status]}
        </span>
    );
}
