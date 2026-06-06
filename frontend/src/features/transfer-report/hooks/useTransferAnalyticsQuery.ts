import { useQuery } from '@tanstack/react-query'
import { stockTransfersService } from '@/services/stock-transfers.service'
import { queryKeys } from '@/lib/queryKeys'
import type { ITransferAnalyticsParams, ITransferAnalyticsResponse } from '@/types'

export function useTransferAnalyticsQuery(
  params: ITransferAnalyticsParams,
  enabled = true,
) {
  return useQuery<ITransferAnalyticsResponse>({
    queryKey: queryKeys.stockTransfers.analytics(params),
    queryFn: () => stockTransfersService.getAnalytics(params),
    enabled,
    staleTime: 60_000,
  })
}
