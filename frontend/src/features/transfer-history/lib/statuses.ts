import { TransferStatus } from '@/constants/enums';

export const HISTORY_STATUSES: { key: TransferStatus; label: string }[] = [
    { key: TransferStatus.COMPLETED, label: 'Completed' },
    { key: TransferStatus.REJECTED, label: 'Rejected' },
    { key: TransferStatus.CANCELLED, label: 'Cancelled' },
];

export const DEFAULT_HISTORY_STATUSES: TransferStatus[] = HISTORY_STATUSES.map(
    (s) => s.key,
);
