import type { IOverviewAlert } from '@/types';

export function alertTone(type: IOverviewAlert['type']): string {
    switch (type) {
        case 'critical_low_stock':
            return 'text-danger border-danger/40 bg-danger-soft';
        case 'no_admin':
            return 'text-warning border-warning/40 bg-warning-soft';
        case 'no_transactions':
            return 'text-info border-info/40 bg-info-soft';
        case 'inactive_branch':
            return 'text-text-2 border-border bg-surface-2';
    }
}
