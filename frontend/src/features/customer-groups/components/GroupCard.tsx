import { Link } from 'react-router-dom'
import {
  LuUsers as Users,
  LuChevronRight as ChevronRight,
} from 'react-icons/lu'
import Pill from '@/components/ui/Pill'
import type { ICustomerGroupSummary } from '@/types'

interface GroupCardProps {
  group: ICustomerGroupSummary
  to: string
}

export function GroupCard({ group, to }: GroupCardProps) {
  const isOwner = group.myRole === 'owner'
  const isArchived = group.status === 'archived'

  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm-token transition-colors hover:border-border-strong focus:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold tracking-tight text-text-1">
          {group.name}
        </h3>
        <ChevronRight
          size={18}
          className="mt-0.5 flex-shrink-0 text-text-3 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill tone={isOwner ? 'primary' : 'neutral'}>
          {isOwner ? 'Owner' : 'Member'}
        </Pill>
        {isArchived && (
          <Pill tone="neutral" dot>
            Archived
          </Pill>
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-sm text-text-2">
        <Users size={15} className="text-text-3" aria-hidden="true" />
        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
      </div>
      <div className="mt-1 text-xs text-text-3">
        Code{' '}
        <span className="font-mono font-semibold text-text-2">
          {group.joinCode}
        </span>
      </div>
    </Link>
  )
}
