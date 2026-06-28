import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'
import type { IUpdateCustomerGroupPayload } from '@/types'

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; payload: IUpdateCustomerGroupPayload }) =>
      customerGroupsService.update(vars.id, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerGroups.all(),
      })
    },
  })
}
