import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'
import type { ISetGroupCartItemQtyPayload } from '@/types'

export function useSetGroupCartItemQty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      id: string
      itemId: string
      payload: ISetGroupCartItemQtyPayload
    }) =>
      customerGroupsService.setCartItemQty(vars.id, vars.itemId, vars.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerGroups.all(),
      })
    },
  })
}
