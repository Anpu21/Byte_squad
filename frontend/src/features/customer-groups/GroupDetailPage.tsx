import { Link, useParams } from 'react-router-dom'
import {
  LuUsers as Users,
  LuSettings as Settings,
  LuLogOut as LogOut,
} from 'react-icons/lu'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui'
import { useGroupDetailPage } from '@/features/customer-groups/hooks/useGroupDetailPage'
import { useGroupRevocation } from '@/features/customer-groups/hooks/useGroupRevocation'
import { GROUP_TABS } from '@/features/customer-groups/components/group-detail-tabs'
import { GroupDetailHeader } from '@/features/customer-groups/components/GroupDetailHeader'
import { GroupHeroLedger } from '@/features/customer-groups/components/GroupHeroLedger'
import { GroupOverviewPanel } from '@/features/customer-groups/components/GroupOverviewPanel'
import { GroupCartPanel } from '@/features/customer-groups/components/GroupCartPanel'
import { GroupMembersCard } from '@/features/customer-groups/components/GroupMembersCard'
import { ShareCodeCard } from '@/features/customer-groups/components/ShareCodeCard'
import { GroupChatPanel } from '@/features/customer-groups/components/GroupChatPanel'
import { GroupAnalyticsPanel } from '@/features/customer-groups/components/GroupAnalyticsPanel'
import { GroupSettingsModal } from '@/features/customer-groups/components/GroupSettingsModal'

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const p = useGroupDetailPage(id)
  useGroupRevocation(id)

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

  // Inject the live unread count onto the Chat tab.
  const tabs = GROUP_TABS.map((t) =>
    t.key === 'chat' && p.chatUnread > 0 ? { ...t, badge: p.chatUnread } : t,
  )

  return (
    <div className="mx-auto max-w-5xl">
      <GroupDetailHeader
        name={group.name}
        isOwner={p.isOwner}
        isArchived={isArchived}
        memberCount={group.memberCount}
        groupsPath={p.groupsPath}
        rightSlot={
          p.isOwner ? (
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
          )
        }
      />

      {/* Hero ledger — group spend at a glance. */}
      <div className="mt-5">
        <GroupHeroLedger groupId={group.id} memberCount={group.memberCount} />
      </div>

      {/* Sub-nav. */}
      <div className="mt-6">
        <Tabs
          tabs={tabs}
          active={p.tab}
          onChange={p.setTab}
          variant="underline"
          idBase="group"
          ariaLabel="Group sections"
        />
      </div>

      <div className="mt-6">
        {/* Overview — the landing dashboard (default tab). */}
        {p.tab === 'overview' && (
          <div
            role="tabpanel"
            id="group-panel-overview"
            aria-labelledby="group-tab-overview"
          >
            <GroupOverviewPanel
              groupId={group.id}
              members={group.members}
              joinCode={group.joinCode}
              chatUnread={p.chatUnread}
              onTab={p.setTab}
            />
          </div>
        )}
        {/* Cart — kept mounted (live cart-sync) and hidden when inactive. */}
        <div
          role="tabpanel"
          id="group-panel-cart"
          aria-labelledby="group-tab-cart"
          hidden={p.tab !== 'cart'}
        >
          <GroupCartPanel groupId={group.id} groupName={group.name} />
        </div>

        {/* Chat — kept mounted (live socket + unread badge), hidden when inactive. */}
        {p.currentUserId && (
          <div
            role="tabpanel"
            id="group-panel-chat"
            aria-labelledby="group-tab-chat"
            hidden={p.tab !== 'chat'}
          >
            <GroupChatPanel
              groupId={group.id}
              members={group.members}
              currentUserId={p.currentUserId}
              isActive={p.tab === 'chat'}
              onUnreadChange={p.setChatUnread}
            />
          </div>
        )}

        {/* Members / Invite / Analytics — mounted lazily on first visit. */}
        {p.tab === 'members' && (
          <div role="tabpanel" id="group-panel-members" aria-labelledby="group-tab-members">
            <GroupMembersCard
              members={group.members}
              isOwner={p.isOwner}
              currentUserId={p.currentUserId}
              onRemove={p.onRemoveMember}
            />
          </div>
        )}

        {p.tab === 'invite' && (
          <div
            role="tabpanel"
            id="group-panel-invite"
            aria-labelledby="group-tab-invite"
            className="max-w-md"
          >
            <ShareCodeCard
              joinCode={group.joinCode}
              isOwner={p.isOwner}
              onRegenerate={p.onRegenerateCode}
              regenerating={p.regenerating}
            />
          </div>
        )}

        {p.tab === 'analytics' && (
          <div role="tabpanel" id="group-panel-analytics" aria-labelledby="group-tab-analytics">
            <GroupAnalyticsPanel />
          </div>
        )}
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
