import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'

export function useClearGroupCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customerGroupsService.clearCart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerGroups.all(),
      })
    },
  })
}
