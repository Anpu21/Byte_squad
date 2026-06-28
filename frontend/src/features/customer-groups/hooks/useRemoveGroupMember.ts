import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerGroupsService } from '@/services/customer-groups.service'
import { queryKeys } from '@/lib/queryKeys'

export function useRemoveGroupMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; userId: string }) =>
      customerGroupsService.removeMember(vars.id, vars.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerGroups.all(),
      })
    },
  })
}
