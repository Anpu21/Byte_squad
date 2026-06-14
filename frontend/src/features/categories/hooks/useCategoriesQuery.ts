import { useQuery } from '@tanstack/react-query'
import { categoriesService } from '@/services/categories.service'
import { queryKeys } from '@/lib/queryKeys'
import type { ICategory } from '@/types'

const STALE_MS = 5 * 60_000 // categories change rarely

export function useCategoriesQuery(includeInactive = false) {
  return useQuery<ICategory[]>({
    queryKey: queryKeys.categories.list(includeInactive),
    queryFn: () => categoriesService.list(includeInactive),
    staleTime: STALE_MS,
  })
}
