import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'
import type { ICreateCustomerGroupPayload } from '@/types'

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ICreateCustomerGroupPayload) =>
      customerGroupsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerGroups.all(),
      })
    },
  })
}
