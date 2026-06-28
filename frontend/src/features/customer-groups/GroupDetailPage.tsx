import { Link, useParams } from 'react-router-dom'
import {
  LuArrowLeft as ArrowLeft,
  LuTrendingUp as TrendingUp,
  LuSettings as Settings,
  LuLogOut as LogOut,
  LuUsers as Users,
} from 'react-icons/lu'
import Button from '@/components/ui/Button'
import Pill from '@/components/ui/Pill'
import EmptyState from '@/components/ui/EmptyState'
import { useGroupDetailPage } from '@/features/customer-groups/hooks/useGroupDetailPage'
import { GroupMembersCard } from '@/features/customer-groups/components/GroupMembersCard'
import { ShareCodeCard } from '@/features/customer-groups/components/ShareCodeCard'
import { GroupSettingsModal } from '@/features/customer-groups/components/GroupSettingsModal'

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const p = useGroupDetailPage(id)

  if (p.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
      </div>
    )
  }

  if (p.isError || !p.group) {
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          icon={<Users size={26} />}
          title="Group not available"
          description="This group doesn't exist, or you're not a member."
          action={
            <Link to={p.groupsPath}>
              <Button variant="secondary">Back to groups</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const group = p.group
  const isArchived = group.status === 'archived'

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to={p.groupsPath}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-2 transition-colors hover:text-text-1"
      >
        <ArrowLeft size={16} /> All groups
      </Link>

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-1 sm:text-3xl">
              {group.name}
            </h1>
            <Pill tone={p.isOwner ? 'primary' : 'neutral'}>
              {p.isOwner ? 'Owner' : 'Member'}
            </Pill>
            {isArchived && (
              <Pill tone="neutral" dot>
                Archived
              </Pill>
            )}
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-2">
            <Users size={15} className="text-text-3" aria-hidden="true" />
            {group.memberCount}{' '}
            {group.memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link to={p.analyticsPath}>
            <Button variant="outline">
              <TrendingUp size={16} /> Analytics
            </Button>
          </Link>
          {p.isOwner ? (
            <Button variant="secondary" onClick={p.openSettings}>
              <Settings size={16} /> Settings
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={p.onLeave}
              disabled={p.leaving}
            >
              <LogOut size={16} /> Leave
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Phase 7 inserts the shared cart panel above the members list. */}
          <GroupMembersCard
            members={group.members}
            isOwner={p.isOwner}
            currentUserId={p.currentUserId}
            onRemove={p.onRemoveMember}
          />
        </div>
        <div className="space-y-6">
          <ShareCodeCard
            joinCode={group.joinCode}
            isOwner={p.isOwner}
            onRegenerate={p.onRegenerateCode}
            regenerating={p.regenerating}
          />
        </div>
      </div>

      {p.isOwner && (
        <GroupSettingsModal
          isOpen={p.settingsOpen}
          onClose={p.closeSettings}
          currentName={group.name}
          onRename={p.onRename}
          onArchive={p.onArchive}
          saving={p.saving}
        />
      )}
    </div>
  )
}
