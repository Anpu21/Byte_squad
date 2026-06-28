import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'
import type { IJoinCustomerGroupPayload } from '@/types'

export function useJoinGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: IJoinCustomerGroupPayload) =>
      customerGroupsService.join(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerGroups.all(),
      })
    },
  })
}
