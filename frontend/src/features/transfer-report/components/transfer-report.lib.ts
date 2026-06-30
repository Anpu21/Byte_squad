import type { DataTableColumn } from '@/components/ui'
import type { ITransferAnalyticsResponse } from '@/types'

export type TopProduct = ITransferAnalyticsResponse['topProducts'][number]

export const TOP_PRODUCT_COLUMNS: DataTableColumn<TopProduct>[] = [
  {
    key: 'productName',
    header: 'Top products',
    className: 'font-medium text-text-1',
    render: (p) => p.productName,
  },
  {
    key: 'transfers',
    header: 'Transfers',
    align: 'right',
    numeric: true,
    render: (p) => p.transfers,
  },
  {
    key: 'units',
    header: 'Units',
    align: 'right',
    numeric: true,
    render: (p) => p.units,
  },
]

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'text-warning' },
  approved: { label: 'Approved', cls: 'text-info' },
  in_transit: { label: 'In transit', cls: 'text-primary' },
  completed: { label: 'Completed', cls: 'text-accent' },
  rejected: { label: 'Rejected', cls: 'text-text-3' },
  cancelled: { label: 'Cancelled', cls: 'text-text-3' },
}

export function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
