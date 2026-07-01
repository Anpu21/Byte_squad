import { useQuery } from '@tanstack/react-query'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'

/** Brand list for the manage table (pass true to include archived brands). */
export function useBrandsQuery(includeInactive = false) {
  return useQuery({
    queryKey: queryKeys.brands.list(includeInactive),
    queryFn: () => brandsService.list(includeInactive),
  })
}
