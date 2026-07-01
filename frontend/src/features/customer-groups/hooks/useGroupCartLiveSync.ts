import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getNotificationSocket } from '@/services/socket.service'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Live-sync a group's shared cart: the socket joins the group's room (so the
 * server's `group-cart:changed` broadcast reaches it — nothing joined that room
 * before), then refetches the cart when any member mutates it. The room join is
 * re-emitted on reconnect. Mirrors useOrderNotificationSocket.
 */
export function useGroupCartLiveSync(groupId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!groupId) return
    const socket = getNotificationSocket()

    // Join the group's room so the server's broadcast actually reaches us, and
    // re-join on every reconnect (rooms are dropped when the socket drops).
    const join = () => socket.emit('group:join', { groupId })
    if (socket.connected) join()
    socket.on('connect', join)

    const onChanged = (payload: { groupId: string }) => {
      if (payload.groupId === groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.customerGroups.cart(groupId),
        })
      }
    }
    socket.on('group-cart:changed', onChanged)

    return () => {
      socket.emit('group:leave', { groupId })
      socket.off('connect', join)
      socket.off('group-cart:changed', onChanged)
    }
  }, [groupId, queryClient])
}
