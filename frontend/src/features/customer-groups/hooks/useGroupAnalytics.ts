import { useQuery } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'
import type { IGroupAnalyticsParams, IGroupAnalyticsResponse } from '@/types'

export function useGroupAnalytics(
  id: string | undefined,
  params: IGroupAnalyticsParams,
  enabled = true,
) {
  return useQuery<IGroupAnalyticsResponse>({
    queryKey: queryKeys.customerGroups.analytics(id ?? '', params),
    queryFn: () => customerGroupsService.getAnalytics(id as string, params),
    enabled: enabled && !!id,
    staleTime: 60_000,
  })
}
