import { TransferStatus } from '@/constants/enums';
import type { IStockTransferRequest } from '@/types';

export function terminalAt(transfer: IStockTransferRequest): string | null {
    if (transfer.status === TransferStatus.COMPLETED) {
        return transfer.receivedAt;
    }
    return transfer.reviewedAt;
}

export function formatHistoryDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

const MS_PER_MIN = 60000;

export function formatDuration(
    fromIso: string,
    toIso: string | null,
): string {
    if (!toIso) return '—';
    const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
    if (ms < 0) return '—';
    const minutes = Math.floor(ms / MS_PER_MIN);
    if (minutes < 1) return '<1m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        const remMin = minutes % 60;
        return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}
