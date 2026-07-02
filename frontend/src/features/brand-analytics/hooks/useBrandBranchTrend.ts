import { useQuery } from '@tanstack/react-query'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'
import type {
  IBrandBranchTrendRequest,
  IBrandBranchTrendResponse,
} from '@/types'

/** One brand's daily trend, one series per branch — null while unresolved. */
export function useBrandBranchTrend(request: IBrandBranchTrendRequest | null) {
  return useQuery<IBrandBranchTrendResponse>({
    queryKey: queryKeys.brands.byBranchTrend(request),
    queryFn: () => brandsService.getBranchTrend(request!),
    enabled: request !== null && request.branchIds.length > 0,
    placeholderData: (previous) => previous,
  })
}
