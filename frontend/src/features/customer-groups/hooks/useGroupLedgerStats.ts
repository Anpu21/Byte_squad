import { useMemo } from 'react'
import { useGroupAnalytics } from '@/features/customer-groups/hooks/useGroupAnalytics'

/**
 * Lifetime-to-date spend summary for a group (total spent, orders, avg order),
 * powering the hero ledger + the Overview spend snapshot. Reuses the analytics
 * endpoint over a wide window; the window is memoized once so the query key is
 * stable (no refetch loop) and shared across both consumers via the cache.
 */
export function useGroupLedgerStats(groupId: string | undefined) {
  const params = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      startDate: new Date('2020-01-01T00:00:00.000Z').toISOString(),
      endDate: new Date(`${today}T23:59:59`).toISOString(),
    }
  }, [])

  return useGroupAnalytics(groupId, params)
}
