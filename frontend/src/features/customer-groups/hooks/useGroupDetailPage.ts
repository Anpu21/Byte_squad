import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FRONTEND_ROUTES } from '@/constants/routes'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectShopContext } from '@/store/selectors/shopContext'
import { clearShopContext } from '@/store/slices/shopContextSlice'
import { useAuth } from '@/hooks/useAuth'
import { useConfirm } from '@/hooks/useConfirm'
import { useTabParam } from '@/hooks/useTabParam'
import {
  GROUP_TAB_KEYS,
  type GroupTab,
} from '@/features/customer-groups/components/group-detail-tabs'
import { useGroup } from '@/features/customer-groups/hooks/useGroup'
import { useLeaveGroup } from '@/features/customer-groups/hooks/useLeaveGroup'
import { useRemoveGroupMember } from '@/features/customer-groups/hooks/useRemoveGroupMember'
import { useRegenerateGroupCode } from '@/features/customer-groups/hooks/useRegenerateGroupCode'
import { useUpdateGroup } from '@/features/customer-groups/hooks/useUpdateGroup'

export function useGroupDetailPage(groupId: string | undefined) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const shopContext = useAppSelector(selectShopContext)

  const { data: group, isLoading, isError } = useGroup(groupId)
  const leaveGroup = useLeaveGroup()
  const removeMember = useRemoveGroupMember()
  const regenerateCode = useRegenerateGroupCode()
  const updateGroup = useUpdateGroup()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const { tab, setTab } = useTabParam<GroupTab>({
    valid: GROUP_TAB_KEYS,
    fallback: 'overview',
  })
  const [chatUnread, setChatUnread] = useState(0)

  const id = groupId ?? ''
  const isOwner = group?.myRole === 'owner'

  // If the user was shopping for this group, drop that context on the way out.
  const clearContextIfActive = () => {
    if (shopContext.groupId === id) dispatch(clearShopContext())
  }

  const onLeave = async () => {
    const ok = await confirm({
      title: 'Leave this group?',
      body: 'You will stop seeing its shared cart and analytics. Items you added stay with the group.',
      confirmLabel: 'Leave group',
      cancelLabel: 'Stay',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await leaveGroup.mutateAsync(id)
      clearContextIfActive()
      toast.success('You left the group')
      navigate(FRONTEND_ROUTES.SHOP_GROUPS)
    } catch {
      toast.error('Could not leave the group')
    }
  }

  const onRemoveMember = async (userId: string, name: string) => {
    const ok = await confirm({
      title: `Remove ${name}?`,
      body: 'They will lose access to this group. They can re-join with the code.',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await removeMember.mutateAsync({ id, userId })
      toast.success(`${name} removed`)
    } catch {
      toast.error('Could not remove the member')
    }
  }

  const onRegenerateCode = async () => {
    const ok = await confirm({
      title: 'Generate a new code?',
      body: 'The current code and any invite links you shared will stop working.',
      confirmLabel: 'Generate new code',
      cancelLabel: 'Keep current',
    })
    if (!ok) return
    try {
      await regenerateCode.mutateAsync(id)
      toast.success('New join code generated')
    } catch {
      toast.error('Could not regenerate the code')
    }
  }

  const onRename = async (name: string) => {
    try {
      await updateGroup.mutateAsync({ id, payload: { name } })
      toast.success('Group renamed')
      setSettingsOpen(false)
    } catch {
      toast.error('Could not rename the group')
    }
  }

  const onArchive = async () => {
    const ok = await confirm({
      title: 'Archive this group?',
      body: 'Archiving hides it from everyone and stops new activity.',
      confirmLabel: 'Archive group',
      cancelLabel: 'Cancel',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await updateGroup.mutateAsync({ id, payload: { status: 'archived' } })
      clearContextIfActive()
      toast.success('Group archived')
      setSettingsOpen(false)
      navigate(FRONTEND_ROUTES.SHOP_GROUPS)
    } catch {
      toast.error('Could not archive the group')
    }
  }

  return {
    group,
    isLoading,
    isError,
    isOwner,
    currentUserId: user?.id,
    settingsOpen,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
    onLeave,
    leaving: leaveGroup.isPending,
    onRemoveMember,
    onRegenerateCode,
    regenerating: regenerateCode.isPending,
    onRename,
    onArchive,
    saving: updateGroup.isPending,
    groupsPath: FRONTEND_ROUTES.SHOP_GROUPS,
    tab,
    setTab,
    chatUnread,
    setChatUnread,
  }
}
