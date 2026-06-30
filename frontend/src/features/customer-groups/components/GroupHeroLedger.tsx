import {
  LuCoins as Coins,
  LuReceipt as Receipt,
  LuCalculator as Calculator,
  LuUsers as Users,
} from 'react-icons/lu'
import { KpiCard } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { useGroupLedgerStats } from '@/features/customer-groups/hooks/useGroupLedgerStats'

interface Props {
  groupId: string
  memberCount: number
}

/**
 * "Ink ledger" hero strip — the group's spend at a glance (total spent, orders,
 * avg order, members). Reuses `KpiCard` so it stays on-token in both themes,
 * and shares the analytics query with the Overview spend snapshot.
 */
export function GroupHeroLedger({ groupId, memberCount }: Props) {
  const { data, isLoading } = useGroupLedgerStats(groupId)
  const dash = (v: string) => (isLoading ? '—' : v)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard
        label="Total spent"
        accent="accent"
        icon={<Coins className="h-4 w-4" />}
        value={dash(formatCurrency(data?.totalSpend ?? 0))}
      />
      <KpiCard
        label="Orders"
        accent="primary"
        icon={<Receipt className="h-4 w-4" />}
        value={dash(String(data?.orderCount ?? 0))}
      />
      <KpiCard
        label="Avg order"
        accent="info"
        icon={<Calculator className="h-4 w-4" />}
        value={dash(formatCurrency(data?.avgOrderValue ?? 0))}
      />
      <KpiCard
        label="Members"
        accent="warning"
        icon={<Users className="h-4 w-4" />}
        value={String(memberCount)}
      />
    </div>
  )
}
