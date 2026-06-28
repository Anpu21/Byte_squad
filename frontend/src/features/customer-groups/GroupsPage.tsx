import { LuPlus as Plus, LuTicket as Ticket } from 'react-icons/lu'
import Button from '@/components/ui/Button'
import { useGroupsPage } from '@/features/customer-groups/hooks/useGroupsPage'
import { GroupCard } from '@/features/customer-groups/components/GroupCard'
import { GroupsEmpty } from '@/features/customer-groups/components/GroupsEmpty'
import { CreateGroupModal } from '@/features/customer-groups/components/CreateGroupModal'
import { JoinGroupModal } from '@/features/customer-groups/components/JoinGroupModal'

export function GroupsPage() {
  const p = useGroupsPage()

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1 sm:text-3xl">
            Shopping groups
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-text-2">
            Shop together with family, flatmates or your office. Share one cart,
            let anyone check out, and see what the group buys over time.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" onClick={p.openJoin}>
            <Ticket size={16} /> Join group
          </Button>
          <Button onClick={p.openCreate}>
            <Plus size={16} /> Create group
          </Button>
        </div>
      </div>

      {p.isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
        </div>
      ) : p.groups.length === 0 ? (
        <GroupsEmpty onCreate={p.openCreate} onJoin={p.openJoin} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {p.groups.map((g) => (
            <GroupCard key={g.id} group={g} to={p.detailPath(g.id)} />
          ))}
        </div>
      )}

      <CreateGroupModal
        isOpen={p.createOpen}
        onClose={p.closeCreate}
        onSubmit={p.submitCreate}
        isPending={p.creating}
      />
      <JoinGroupModal
        isOpen={p.joinOpen}
        onClose={p.closeJoin}
        onSubmit={p.submitJoin}
        isPending={p.joining}
        initialCode={p.joinPrefill}
      />
    </div>
  )
}
