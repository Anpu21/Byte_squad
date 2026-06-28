import { LuUsers as Users } from 'react-icons/lu'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'

interface GroupsEmptyProps {
  onCreate: () => void
  onJoin: () => void
}

export function GroupsEmpty({ onCreate, onJoin }: GroupsEmptyProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface">
      <EmptyState
        icon={<Users size={26} />}
        title="No groups yet"
        description="Create a group and share the code, or join one with a code a friend sent you."
        action={
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={onJoin}>
              Join with a code
            </Button>
            <Button onClick={onCreate}>Create a group</Button>
          </div>
        }
      />
    </div>
  )
}
