import { formatCurrency } from '@/lib/utils'
import type { DataTableColumn } from '@/components/ui'
import type { IBrandProductRow } from '@/types'

/** Product-breakdown columns, shared by the brand drill-down table. */
export const brandProductColumns: DataTableColumn<IBrandProductRow>[] = [
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
    header: 'Revenue',
    align: 'right',
    numeric: true,
    render: (r) => formatCurrency(r.revenue),
  },
  {
    key: 'profit',
    header: 'Profit',
    align: 'right',
    numeric: true,
    render: (r) => formatCurrency(r.profit),
  },
  {
    key: 'margin',
    header: 'Margin',
    align: 'right',
    numeric: true,
    render: (r) => `${r.marginPct}%`,
  },
  {
    key: 'share',
    header: 'Share',
    align: 'right',
    numeric: true,
    render: (r) => `${r.sharePct}%`,
  },
]
