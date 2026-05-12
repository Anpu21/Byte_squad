import type { ICustomerRequest } from '@/types';
import { isThisMonth, isToday } from './date-helpers';

export interface RequestsKpis {
    pending: number;
    completedToday: number;
    monthTotal: number;
}

export function computeRequestsKpis(
    requests: ICustomerRequest[],
): RequestsKpis {
    let pending = 0;
    let completedToday = 0;
    let monthTotal = 0;
    for (const r of requests) {
        const created = new Date(r.createdAt);
        if (r.status === 'pending') pending++;
        if (r.status === 'completed' && isToday(created)) completedToday++;
        if (isThisMonth(created)) monthTotal++;
    }
    return { pending, completedToday, monthTotal };
}
