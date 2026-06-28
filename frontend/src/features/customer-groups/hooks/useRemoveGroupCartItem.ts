import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'

export function useRemoveGroupCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; itemId: string }) =>
      customerGroupsService.removeCartItem(vars.id, vars.itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerGroups.all(),
      })
    },
  })
}
