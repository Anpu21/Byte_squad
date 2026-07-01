import { type DataTableColumn } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { ICategorySalesRow } from '@/types'

/** Columns for the category-sales table. */
export const CATEGORY_COLUMNS: DataTableColumn<ICategorySalesRow>[] = [
  {
    key: 'category',
    header: 'Category',
    className: 'font-medium text-text-1',
    render: (r) => (
      <span className="inline-flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: r.color ?? 'var(--primary)' }}
        />
        {r.categoryName}
      </span>
    ),
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
    key: 'share',
    header: 'Share',
    align: 'right',
    numeric: true,
    render: (r) => `${r.sharePct}%`,
  },
  {
    key: 'txns',
    header: 'Txns',
    align: 'right',
    numeric: true,
    render: (r) => r.transactions,
  },
]
