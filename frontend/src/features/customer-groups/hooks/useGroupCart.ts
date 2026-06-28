import { useQuery } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'
import type { IGroupCartView } from '@/types'

export function useGroupCart(id: string | undefined) {
  return useQuery<IGroupCartView>({
    queryKey: queryKeys.customerGroups.cart(id ?? ''),
    queryFn: () => customerGroupsService.getCart(id as string),
    enabled: !!id,
  })
}
