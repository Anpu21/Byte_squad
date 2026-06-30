import { useQuery } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'
import type { ICustomerGroupDetail } from '@/types'

export function useGroup(id: string | undefined) {
  return useQuery<ICustomerGroupDetail>({
    queryKey: queryKeys.customerGroups.detail(id ?? ''),
    queryFn: () => customerGroupsService.getById(id as string),
    enabled: !!id,
  })
}
