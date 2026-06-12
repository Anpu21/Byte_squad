import { useQuery } from '@tanstack/react-query';
import { salesReportsService } from '@/services/sales-reports.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ISalesmanReportParams } from '@/types';

/** Cashier-wise sales aggregates over a date window. */
export function useSalesmanReport(params: ISalesmanReportParams) {
    return useQuery({
        queryKey: queryKeys.pos.salesmanReport(params),
        queryFn: () => salesReportsService.salesman(params),
        staleTime: 30_000,
    });
}
