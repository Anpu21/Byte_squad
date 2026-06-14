import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { stockTransfersService } from '@/services/stock-transfers.service'
import { queryKeys } from '@/lib/queryKeys'
import { FRONTEND_ROUTES } from '@/constants/routes'
import { useTransferAnalyticsQuery } from '@/features/transfer-report/hooks/useTransferAnalyticsQuery'

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'text-warning' },
  approved: { label: 'Approved', cls: 'text-info' },
  in_transit: { label: 'In transit', cls: 'text-primary' },
  completed: { label: 'Completed', cls: 'text-accent' },
  rejected: { label: 'Rejected', cls: 'text-text-3' },
  cancelled: { label: 'Cancelled', cls: 'text-text-3' },
}

/** Admin dashboard widget: pending/in-transit counts + the latest transfers. */
export function TransferActivityCard() {
  const analytics = useTransferAnalyticsQuery({})
  const recent = useQuery({
    queryKey: queryKeys.stockTransfers.all({ page: 1, limit: 5 }),
    queryFn: () => stockTransfersService.listAll({ page: 1, limit: 5 }),
    staleTime: 30_000,
  })

  const pending = analytics.data?.kpis.pending ?? 0
  const inTransit = analytics.data?.kpis.inTransit ?? 0
  const rows = recent.data?.items ?? []

  return (
    <Card>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
            Stock transfers
          </h3>
          <p className="text-xs text-text-2 mt-0.5">
            {pending} pending · {inTransit} in transit
          </p>
        </div>
        <Link
          to={FRONTEND_ROUTES.ADMIN_TRANSFERS}
          className="text-xs font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="overflow-auto max-h-[360px]">
        {rows.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2">
                <th className="px-5 py-2.5 text-left font-semibold">Product</th>
                <th className="px-5 py-2.5 text-left font-semibold">Route</th>
                <th className="px-5 py-2.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const meta = STATUS_META[t.status] ?? {
                  label: t.status,
                  cls: 'text-text-2',
                }
                return (
                  <tr
                    key={t.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                  >
                    <td className="px-5 py-3 text-[13px] text-text-1">
                      {t.product?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-2">
                      {t.sourceBranch?.name ?? '—'} → {t.destinationBranch?.name ?? '—'}
                    </td>
                    <td
                      className={`px-5 py-3 text-[13px] font-medium text-right ${meta.cls}`}
                    >
                      {meta.label}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No transfers yet" />
        )}
      </div>
    </Card>
  )
}
