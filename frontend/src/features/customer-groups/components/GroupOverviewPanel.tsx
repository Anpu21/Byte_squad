import toast from 'react-hot-toast'
import {
  LuArrowRight as ArrowRight,
  LuShoppingCart as ShoppingCart,
  LuMessageCircle as MessageCircle,
  LuCopy as Copy,
  LuTrendingUp as TrendingUp,
} from 'react-icons/lu'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Pill from '@/components/ui/Pill'
import { formatCurrency } from '@/lib/utils'
import { useGroupCart } from '@/features/customer-groups/hooks/useGroupCart'
import { useGroupLedgerStats } from '@/features/customer-groups/hooks/useGroupLedgerStats'
import type { GroupTab } from '@/features/customer-groups/components/group-detail-tabs'
import type { ICustomerGroupMemberView } from '@/types'

interface Props {
  groupId: string
  members: ICustomerGroupMemberView[]
  joinCode: string
  chatUnread: number
  onTab: (tab: GroupTab) => void
}

function GoLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-focus transition-colors hover:text-text-1"
    >
      {label} <ArrowRight size={14} />
    </button>
  )
}

function CartSummaryCard({ groupId, onTab }: Pick<Props, 'groupId' | 'onTab'>) {
  const { data: cart, isLoading } = useGroupCart(groupId)
  const count = cart?.itemCount ?? 0
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared cart</CardTitle>
        <ShoppingCart size={16} className="text-text-3" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-text-3">Loading…</p>
        ) : count === 0 ? (
          <p className="text-sm text-text-3">Your shared cart is empty.</p>
        ) : (
          <>
            <p className="num text-2xl font-bold text-text-1">
              {formatCurrency(cart?.total ?? 0)}
            </p>
            <p className="mt-0.5 text-sm text-text-2">
              {count} {count === 1 ? 'item' : 'items'} in the cart
            </p>
          </>
        )}
        <GoLink label="Open full cart" onClick={() => onTab('cart')} />
      </CardContent>
    </Card>
  )
}

function SpendSnapshotCard({ groupId, onTab }: Pick<Props, 'groupId' | 'onTab'>) {
  const { data, isLoading } = useGroupLedgerStats(groupId)
  const rows = [
    ['Total spent', formatCurrency(data?.totalSpend ?? 0)],
    ['Avg order', formatCurrency(data?.avgOrderValue ?? 0)],
    ['Orders', String(data?.orderCount ?? 0)],
  ] as const
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spend snapshot</CardTitle>
        <TrendingUp size={16} className="text-text-3" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-text-2">{label}</dt>
              <dd className="num text-sm font-semibold text-text-1">
                {isLoading ? '—' : value}
              </dd>
            </div>
          ))}
        </dl>
        <GoLink label="View analytics" onClick={() => onTab('analytics')} />
      </CardContent>
    </Card>
  )
}

function MembersPreviewCard({
  members,
  onTab,
}: Pick<Props, 'members' | 'onTab'>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <span className="text-xs font-medium text-text-3">{members.length}</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center -space-x-2">
          {members.slice(0, 6).map((m) => (
            <span
              key={m.userId}
              className="rounded-full ring-2 ring-surface"
              title={m.name}
            >
              <Avatar name={m.name} size={32} />
            </span>
          ))}
          {members.length > 6 && (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-text-2 ring-2 ring-surface">
              +{members.length - 6}
            </span>
          )}
        </div>
        <GoLink label="Manage members" onClick={() => onTab('members')} />
      </CardContent>
    </Card>
  )
}

function InvitePreviewCard({
  joinCode,
  onTab,
}: Pick<Props, 'joinCode' | 'onTab'>) {
  const copy = () => {
    navigator.clipboard
      .writeText(joinCode)
      .then(() => toast.success('Join code copied'))
      .catch(() => toast.error('Could not copy the code'))
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite people</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-1 text-xs font-medium text-text-3">Join code</p>
        <button
          type="button"
          onClick={copy}
          className="num inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-lg font-bold tracking-wider text-text-1 transition-colors hover:border-focus"
        >
          {joinCode}
          <Copy size={15} className="text-text-3" aria-hidden="true" />
        </button>
        <GoLink label="Invite people" onClick={() => onTab('invite')} />
      </CardContent>
    </Card>
  )
}

function ChatPreviewCard({
  chatUnread,
  onTab,
}: Pick<Props, 'chatUnread' | 'onTab'>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Group chat</CardTitle>
        <MessageCircle size={16} className="text-text-3" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {chatUnread > 0 ? (
          <Pill tone="primary">
            {chatUnread} new {chatUnread === 1 ? 'message' : 'messages'}
          </Pill>
        ) : (
          <p className="text-sm text-text-3">You&apos;re all caught up.</p>
        )}
        <GoLink label="Open chat" onClick={() => onTab('chat')} />
      </CardContent>
    </Card>
  )
}

/** Overview dashboard — compact preview cards that deep-link to each section. */
export function GroupOverviewPanel(p: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CartSummaryCard groupId={p.groupId} onTab={p.onTab} />
      <SpendSnapshotCard groupId={p.groupId} onTab={p.onTab} />
      <MembersPreviewCard members={p.members} onTab={p.onTab} />
      <InvitePreviewCard joinCode={p.joinCode} onTab={p.onTab} />
      <ChatPreviewCard chatUnread={p.chatUnread} onTab={p.onTab} />
    </div>
  )
}
