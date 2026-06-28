import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getNotificationSocket } from '@/services/socket.service'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Live-sync a group's shared cart: when any member mutates the cart the server
 * broadcasts `group-cart:changed`, and this refetches the cart for the open
 * group. Mirrors useOrderNotificationSocket.
 */
export function useGroupCartLiveSync(groupId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!groupId) return
    const socket = getNotificationSocket()
    const onChanged = (payload: { groupId: string }) => {
      if (payload.groupId === groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.customerGroups.cart(groupId),
        })
      }
    }
    socket.on('group-cart:changed', onChanged)
    return () => {
      socket.off('group-cart:changed', onChanged)
    }
  }, [groupId, queryClient])
}
