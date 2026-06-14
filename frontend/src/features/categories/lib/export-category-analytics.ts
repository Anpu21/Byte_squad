import { formatCurrency } from '@/lib/utils'
import {
  exportData,
  type ExportColumn,
  type ExportFormat,
} from '@/lib/exportUtils'
import type { ICategorySalesRow } from '@/types'

interface ExportArgs {
  rows: ICategorySalesRow[]
  format: ExportFormat
  scopeLabel: string
  rangeLabel: string
  totals: {
    totalRevenue: number
    totalUnits: number
    totalTransactions: number
  }
  user: { firstName: string; lastName: string } | null
}

/**
 * Build the category-sales PDF/Excel export, reusing the shared exporter
 * (lib/exportUtils). Admin/Manager only — the cashier view never calls this.
 */
export async function exportCategoryAnalytics({
  rows,
  format,
  scopeLabel,
  rangeLabel,
  totals,
  user,
}: ExportArgs): Promise<void> {
  const columns: ExportColumn<ICategorySalesRow>[] = [
    { header: 'Category', key: 'categoryName' },
    { header: 'Units', key: 'units', align: 'right' },
    {
      header: 'Revenue',
      key: 'revenue',
      align: 'right',
      format: 'currency',
      footer: 'sum',
    },
    { header: 'Share %', key: 'sharePct', align: 'right' },
    { header: 'Transactions', key: 'transactions', align: 'right' },
  ]

  await exportData(format, rows, columns, {
    title: 'Category Sales Report',
    subtitle: `${scopeLabel}  ·  ${rangeLabel}`,
    filenameBase: 'category-sales',
    companyName: 'LedgerPro',
    generatedBy: user ? `${user.firstName} ${user.lastName}` : undefined,
    summary: [
      { label: 'Categories', value: String(rows.length) },
      { label: 'Total Units', value: String(Math.round(totals.totalUnits)) },
      { label: 'Total Revenue', value: formatCurrency(totals.totalRevenue) },
      { label: 'Transactions', value: String(totals.totalTransactions) },
    ],
  })
}
