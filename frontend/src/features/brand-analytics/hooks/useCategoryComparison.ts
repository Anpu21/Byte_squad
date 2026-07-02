import { useQuery } from '@tanstack/react-query'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'
import type {
  IBrandAnalyticsParams,
  ICategoryBrandComparisonResponse,
} from '@/types'

/** "Same category, different brands" — every brand's sales within a category. */
export function useCategoryComparison(
  categoryId: string | null,
  params: IBrandAnalyticsParams,
) {
  return useQuery<ICategoryBrandComparisonResponse>({
    queryKey: queryKeys.brands.categoryComparison(categoryId ?? '', params),
    queryFn: () =>
      brandsService.getCategoryComparison(categoryId as string, params),
    enabled: Boolean(categoryId),
    staleTime: 60_000,
  })
}
