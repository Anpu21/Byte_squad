import { useQuery } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'
import type { ICustomerGroupSummary } from '@/types'

export function useMyGroups() {
  return useQuery<ICustomerGroupSummary[]>({
    queryKey: queryKeys.customerGroups.mine(),
    queryFn: () => customerGroupsService.listMine(),
    staleTime: 30_000,
  })
}
