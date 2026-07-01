import { type DataTableColumn } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { IGroupMemberSpendRow, IGroupProductSpendRow } from '@/types'

/** Per-member spend table columns for the group analytics panel. */
export const memberColumns: DataTableColumn<IGroupMemberSpendRow>[] = [
  {
    key: 'member',
    header: 'Member',
    className: 'font-medium text-text-1',
    render: (r) => r.name,
  },
  {
    key: 'orders',
    header: 'Orders',
    align: 'right',
    numeric: true,
    render: (r) => r.orders,
  },
  {
    key: 'spend',
    header: 'Spent',
    align: 'right',
    numeric: true,
    render: (r) => formatCurrency(r.spend),
  },
  {
    key: 'share',
    header: 'Share',
    align: 'right',
    numeric: true,
    render: (r) => `${r.sharePct}%`,
  },
]

/** Top-products-by-spend table columns for the group analytics panel. */
export const productColumns: DataTableColumn<IGroupProductSpendRow>[] = [
  {
    key: 'product',
    header: 'Product',
    className: 'font-medium text-text-1',
    render: (r) => r.productName,
  },
  {
    key: 'units',
    header: 'Units',
    align: 'right',
    numeric: true,
    render: (r) => Math.round(r.units),
  },
  {
    key: 'revenue',
    header: 'Spent',
    align: 'right',
    numeric: true,
    render: (r) => formatCurrency(r.revenue),
  },
  {
    key: 'share',
    header: 'Share',
    align: 'right',
    numeric: true,
    render: (r) => `${r.sharePct}%`,
  },
]
