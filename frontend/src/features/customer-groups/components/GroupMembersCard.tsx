import { LuTrash2 as Trash2 } from 'react-icons/lu'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Pill from '@/components/ui/Pill'
import type { ICustomerGroupMemberView } from '@/types'

interface GroupMembersCardProps {
  members: ICustomerGroupMemberView[]
  isOwner: boolean
  currentUserId: string | undefined
  onRemove: (userId: string, name: string) => void
}

export function GroupMembersCard({
  members,
  isOwner,
  currentUserId,
  onRemove,
}: GroupMembersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <span className="text-xs font-medium text-text-3">{members.length}</span>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {members.map((m) => {
            const isSelf = m.userId === currentUserId
            const canRemove = isOwner && m.role !== 'owner' && !isSelf
            return (
              <li
                key={m.userId}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <Avatar name={m.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-1">
                    {m.name}
                    {isSelf && (
                      <span className="ml-1.5 text-xs font-normal text-text-3">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-text-3">{m.email}</p>
                </div>
                {m.role === 'owner' && <Pill tone="primary">Owner</Pill>}
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(m.userId, m.name)}
                    aria-label={`Remove ${m.name}`}
                    className="rounded-md p-1.5 text-text-3 transition-colors hover:bg-danger-soft hover:text-danger focus:outline-none focus-visible:ring-[3px] focus-visible:ring-danger/30"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
