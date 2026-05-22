import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountingService } from '@/services/accounting.service';
import { queryKeys } from '@/lib/queryKeys';
import { rangeForPeriod, type PeriodKey } from '../lib/period';

export function useProfitLossPage() {
    const initial = rangeForPeriod('month');
    const [period, setPeriod] = useState<PeriodKey>('month');
    const [startDate, setStartDate] = useState(initial.start);
    const [endDate, setEndDate] = useState(initial.end);

    const query = useQuery({
        queryKey: queryKeys.accounting.profitLoss(startDate, endDate),
        queryFn: () => accountingService.getProfitLoss(startDate, endDate),
    });

    const handlePeriodChange = (next: PeriodKey) => {
        setPeriod(next);
        if (next !== 'custom') {
            const r = rangeForPeriod(next);
            setStartDate(r.start);
            setEndDate(r.end);
        }
    };

    return {
        period,
        setPeriod,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        handlePeriodChange,
        data: query.data,
        isLoading: query.isLoading,
        error: query.error ? 'Failed to load profit & loss data' : null,
    };
}
