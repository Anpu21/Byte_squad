import { TransferStatus } from '@/constants/enums';

export interface BoardColumnConfig {
    id: string;
    label: string;
    statuses: TransferStatus[];
    dotClass: string;
}

export const BOARD_COLUMNS: BoardColumnConfig[] = [
    {
        id: 'todo',
        label: 'To Do',
        statuses: [TransferStatus.PENDING],
        dotClass: 'bg-warning',
    },
    {
        id: 'approved',
        label: 'Approved',
        statuses: [TransferStatus.APPROVED],
        dotClass: 'bg-info',
    },
    {
        id: 'in-transit',
        label: 'In Transit',
        statuses: [TransferStatus.IN_TRANSIT],
        dotClass: 'bg-primary',
    },
    {
        id: 'done',
        label: 'Completed',
        statuses: [TransferStatus.COMPLETED],
        dotClass: 'bg-accent',
    },
    {
        id: 'closed',
        label: 'Rejected · Cancelled',
        statuses: [TransferStatus.REJECTED, TransferStatus.CANCELLED],
        dotClass: 'bg-text-3',
    },
];
