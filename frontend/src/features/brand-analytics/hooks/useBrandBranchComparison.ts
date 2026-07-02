import { useQuery } from '@tanstack/react-query'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'
import type {
  IBrandBranchComparisonRequest,
  IBrandBranchComparisonResponse,
} from '@/types'

/** Brand×branch comparison — pass null while no branches are selected. */
export function useBrandBranchComparison(
  request: IBrandBranchComparisonRequest | null,
) {
  return useQuery<IBrandBranchComparisonResponse>({
    queryKey: queryKeys.brands.byBranch(request),
    queryFn: () => brandsService.getBranchComparison(request!),
    enabled: request !== null && request.branchIds.length > 0,
    placeholderData: (previous) => previous,
  })
}
