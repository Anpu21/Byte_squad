import { useQuery } from '@tanstack/react-query'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'
import type { IBrandAnalyticsParams, IBrandOverviewResponse } from '@/types'

export function useBrandOverview(params: IBrandAnalyticsParams, enabled = true) {
  return useQuery<IBrandOverviewResponse>({
    queryKey: queryKeys.brands.overview(params),
    queryFn: () => brandsService.getOverview(params),
    enabled,
    staleTime: 60_000,
  })
}
