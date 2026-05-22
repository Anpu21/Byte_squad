import type { ICustomerOrder } from '@/types';
import { isThisMonth, isToday } from './date-helpers';

export interface OrdersKpis {
    pending: number;
    completedToday: number;
    monthTotal: number;
}

export function computeOrdersKpis(
    requests: ICustomerOrder[],
): OrdersKpis {
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
