import { useQuery } from '@tanstack/react-query'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'
import type {
  ICategoryProductsParams,
  ICategoryProductsResponse,
} from '@/types'

/** Paginated, brand-tagged product roster within a category. */
export function useCategoryProducts(
  categoryId: string | null,
  params: ICategoryProductsParams,
) {
  return useQuery<ICategoryProductsResponse>({
    queryKey: queryKeys.brands.categoryProducts(categoryId ?? '', params),
    queryFn: () =>
      brandsService.getCategoryProducts(categoryId as string, params),
    enabled: Boolean(categoryId),
    placeholderData: (previous) => previous,
  })
}
