import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowLeft as ArrowLeft, LuUsers as Users } from 'react-icons/lu'
import Pill from '@/components/ui/Pill'

interface Props {
  name: string
  isOwner: boolean
  isArchived: boolean
  memberCount: number
  groupsPath: string
  /** Right-aligned cluster — the Settings/Leave action followed by the tabs. */
  rightSlot?: ReactNode
}

/**
 * Group detail header band: a back link plus the group name, role + archived
 * pills, and member count on the left, with the Settings/Leave action and the
 * section tabs grouped on the right (`rightSlot`).
 */
export function GroupDetailHeader({
  name,
  isOwner,
  isArchived,
  memberCount,
  groupsPath,
  rightSlot,
}: Props) {
  return (
    <div>
      <Link
        to={groupsPath}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-2 transition-colors hover:text-text-1"
      >
        <ArrowLeft size={16} /> All groups
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-1 sm:text-3xl">
              {name}
            </h1>
            <Pill tone={isOwner ? 'primary' : 'neutral'}>
              {isOwner ? 'Owner' : 'Member'}
            </Pill>
            {isArchived && (
              <Pill tone="neutral" dot>
                Archived
              </Pill>
            )}
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-2">
            <Users size={15} className="text-text-3" aria-hidden="true" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>

        {rightSlot && (
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  )
}
