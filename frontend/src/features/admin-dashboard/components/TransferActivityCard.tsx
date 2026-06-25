import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui'
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

  type Transfer = (typeof rows)[number]

  const columns: DataTableColumn<Transfer>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (t) => t.product?.name ?? '—',
    },
    {
      key: 'route',
      header: 'Route',
      className: 'text-xs text-text-2',
      render: (t) =>
        `${t.sourceBranch?.name ?? '—'} → ${t.destinationBranch?.name ?? '—'}`,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      className: 'font-medium',
      render: (t) => {
        const meta = STATUS_META[t.status] ?? {
          label: t.status,
          cls: 'text-text-2',
        }
        return <span className={meta.cls}>{meta.label}</span>
      },
    },
  ]

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
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(t) => t.id}
        isLoading={recent.isLoading}
        zebra
        stickyHeader
        maxHeight="360px"
        empty={<EmptyState title="No transfers yet" />}
      />
    </Card>
  )
}
