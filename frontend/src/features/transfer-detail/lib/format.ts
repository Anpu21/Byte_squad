import type { ITransferUserSummary } from '@/types';

export function fullName(user: ITransferUserSummary | null): string {
    if (!user) return '—';
    return `${user.firstName} ${user.lastName}`.trim();
}

export function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}
