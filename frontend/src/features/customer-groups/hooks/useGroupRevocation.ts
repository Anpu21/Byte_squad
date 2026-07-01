import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getNotificationSocket } from '@/services/socket.service'
import { queryKeys } from '@/lib/queryKeys'
import { FRONTEND_ROUTES } from '@/constants/routes'

/**
 * Bounce a member off a group's page the moment their access is revoked — they're
 * removed, they left elsewhere, or the owner archived the group. The realtime
 * service emits `group:revoked` on /notifications; refresh the groups list and
 * navigate back to the index so a removed member can't keep viewing the page.
 */
export function useGroupRevocation(groupId: string | undefined): void {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!groupId) return
    const socket = getNotificationSocket()
    const onRevoked = (data: { groupId: string }) => {
      if (data.groupId !== groupId) return
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerGroups.all(),
      })
      toast('You no longer have access to this group')
      navigate(FRONTEND_ROUTES.SHOP_GROUPS)
    }
    socket.on('group:revoked', onRevoked)
    return () => {
      socket.off('group:revoked', onRevoked)
    }
  }, [groupId, navigate, queryClient])
}
