import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'

export function useRegenerateGroupCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customerGroupsService.regenerateCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerGroups.all(),
      })
    },
  })
}
