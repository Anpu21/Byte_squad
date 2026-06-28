import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FRONTEND_ROUTES } from '@/constants/routes'
import { useMyGroups } from '@/features/customer-groups/hooks/useMyGroups'
import { useCreateGroup } from '@/features/customer-groups/hooks/useCreateGroup'
import { useJoinGroup } from '@/features/customer-groups/hooks/useJoinGroup'

const detailPath = (id: string) =>
  FRONTEND_ROUTES.SHOP_GROUP_DETAIL.replace(':id', id)

export function useGroupsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: groups = [], isLoading } = useMyGroups()
  const createGroup = useCreateGroup()
  const joinGroup = useJoinGroup()

  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpenManual, setJoinOpenManual] = useState(false)

  // An invite link lands here as /shop/groups?join=CODE. Derive the join
  // modal's open state + prefill straight from the URL (no effect, no cascading
  // render); closing consumes the param so it doesn't reopen.
  const joinPrefill = searchParams.get('join') ?? ''
  const joinOpen = joinOpenManual || joinPrefill.length > 0

  const openJoin = () => setJoinOpenManual(true)
  const closeJoin = () => {
    setJoinOpenManual(false)
    if (joinPrefill) {
      setSearchParams(
        (prev) => {
          prev.delete('join')
          return prev
        },
        { replace: true },
      )
    }
  }

  const submitCreate = async (name: string) => {
    try {
      const group = await createGroup.mutateAsync({ name })
      toast.success('Group created')
      setCreateOpen(false)
      navigate(detailPath(group.id))
    } catch {
      toast.error('Could not create the group')
    }
  }

  const submitJoin = async (joinCode: string) => {
    try {
      const group = await joinGroup.mutateAsync({ joinCode })
      toast.success(`Joined ${group.name}`)
      closeJoin()
      navigate(detailPath(group.id))
    } catch {
      toast.error('That code is invalid or expired')
    }
  }

  return {
    groups,
    isLoading,
    detailPath,
    createOpen,
    openCreate: () => setCreateOpen(true),
    closeCreate: () => setCreateOpen(false),
    submitCreate,
    creating: createGroup.isPending,
    joinOpen,
    openJoin,
    closeJoin,
    submitJoin,
    joining: joinGroup.isPending,
    joinPrefill,
  }
}
