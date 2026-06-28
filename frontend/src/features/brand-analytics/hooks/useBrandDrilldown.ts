import { useQuery } from '@tanstack/react-query'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'
import type { IBrandAnalyticsParams, IBrandDrilldownResponse } from '@/types'

/**
 * Drill-down for a single brand. Disabled until a brand is selected, so the
 * overview leaderboard can stay mounted while a brand row is picked.
 */
export function useBrandDrilldown(
  brandId: string | null,
  params: IBrandAnalyticsParams,
  enabled = true,
) {
  return useQuery<IBrandDrilldownResponse>({
    queryKey: queryKeys.brands.drilldown(brandId ?? '', params),
    queryFn: () => brandsService.getBrandAnalytics(brandId as string, params),
    enabled: enabled && Boolean(brandId),
    staleTime: 60_000,
  })
}
