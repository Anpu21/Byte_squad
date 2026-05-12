import { TransferStatus } from '@/constants/enums';

export type StatusFilter = 'all' | TransferStatus;

export const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: TransferStatus.PENDING, label: 'Pending' },
    { key: TransferStatus.APPROVED, label: 'Approved' },
    { key: TransferStatus.IN_TRANSIT, label: 'In Transit' },
    { key: TransferStatus.COMPLETED, label: 'Completed' },
    { key: TransferStatus.REJECTED, label: 'Rejected' },
    { key: TransferStatus.CANCELLED, label: 'Cancelled' },
];

export const COUNT_STATUSES: TransferStatus[] = [
    TransferStatus.PENDING,
    TransferStatus.APPROVED,
    TransferStatus.IN_TRANSIT,
    TransferStatus.COMPLETED,
    TransferStatus.REJECTED,
    TransferStatus.CANCELLED,
];
