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
        'bg-white/10 text-white border-white/20',
    [TransferStatus.APPROVED]:
        'bg-transparent text-slate-200 border-white/30',
    [TransferStatus.REJECTED]:
        'bg-rose-500/10 text-rose-300 border-rose-500/30 border-dashed',
    [TransferStatus.IN_TRANSIT]:
        'bg-amber-500/10 text-amber-300 border-amber-500/30',
    [TransferStatus.COMPLETED]:
        'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    [TransferStatus.CANCELLED]:
        'bg-transparent text-slate-500 border-white/10 border-dashed',
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
