import { useQuery } from '@tanstack/react-query'
import { categoriesService } from '@/services/categories.service'
import { queryKeys } from '@/lib/queryKeys'
import type {
  ICategoryAnalyticsParams,
  ICategoryAnalyticsResponse,
} from '@/types'

export function useCategoryAnalyticsQuery(
  params: ICategoryAnalyticsParams,
  enabled = true,
) {
  return useQuery<ICategoryAnalyticsResponse>({
    queryKey: queryKeys.categories.analytics(params),
    queryFn: () => categoriesService.getAnalytics(params),
    enabled,
    staleTime: 60_000,
  })
}
