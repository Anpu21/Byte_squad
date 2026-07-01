import { formatCurrency } from '@/lib/utils';

import type { ExportColumn } from './types';

export function getPath<T>(row: T, key: keyof T | string): unknown {
    if (typeof key !== 'string' || !key.includes('.')) {
        return (row as Record<string, unknown>)[key as string];
    }
    return key
        .split('.')
        .reduce<unknown>(
            (acc, part) =>
                acc == null
                    ? acc
                    : (acc as Record<string, unknown>)[part],
            row,
        );
}

export function toNumber(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

export function formatDate(value: unknown): string {
    if (value == null || value === '') return '';
    const d = new Date(value as string | number | Date);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatCellAsString<T>(row: T, col: ExportColumn<T>): string {
    const raw = getPath(row, col.key);
    if (raw == null || raw === '') return '';
    if (col.format === 'currency') return formatCurrency(toNumber(raw));
    if (col.format === 'date') return formatDate(raw);
    return String(raw);
}

export function todayStamp(): string {
    return new Date().toISOString().split('T')[0];
}

export function fullTimestamp(d: Date): string {
    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
