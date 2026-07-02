import type { ExportColumn, ExportMetadata } from '@/lib/exportUtils'
import { formatCurrency } from '@/lib/utils'
import type { IBrandBranchComparisonResponse } from '@/types'

/** Flattened matrix row — per-branch revenue under stable positional keys. */
export interface BrandBranchExportRow {
  [key: string]: string | number
}

export interface BrandBranchExportPayload {
  rows: BrandBranchExportRow[]
  columns: ExportColumn<BrandBranchExportRow>[]
  meta: ExportMetadata
}

const branchKey = (index: number): string => `branch_${index}`
const day = (iso: string): string => iso.slice(0, 10)

/**
 * Shape the (unpaginated) brand×branch comparison into the shared
 * `exportData` payload — one revenue column per selected branch plus totals,
 * share, and margin. Mirrors branch-comparison's `buildComparisonExport`.
 */
export function buildBrandBranchExport(
  comparison: IBrandBranchComparisonResponse,
): BrandBranchExportPayload {
  const rows: BrandBranchExportRow[] = comparison.rows.map((row) => {
    const flat: BrandBranchExportRow = { brand: row.brandName }
    comparison.branches.forEach((branch, index) => {
      flat[branchKey(index)] =
        row.perBranch.find((c) => c.branchId === branch.branchId)?.revenue ?? 0
    })
    flat.total = row.revenue
    flat.share = `${row.sharePct}%`
    flat.margin = `${row.marginPct}%`
    return flat
  })

  const columns: ExportColumn<BrandBranchExportRow>[] = [
    { header: 'Brand', key: 'brand' },
    ...comparison.branches.map((branch, index) => ({
      header: branch.branchName,
      key: branchKey(index),
      align: 'right' as const,
      format: 'currency' as const,
      footer: 'sum' as const,
    })),
    {
      header: 'Total',
      key: 'total',
      align: 'right',
      format: 'currency',
      footer: 'sum',
    },
    { header: 'Share', key: 'share', align: 'right' },
    { header: 'Margin', key: 'margin', align: 'right' },
  ]

  const meta: ExportMetadata = {
    title: 'Brand × Branch Comparison',
    subtitle: `${day(comparison.startDate)} – ${day(comparison.endDate)}`,
    filenameBase: `brand-branch-comparison-${day(comparison.startDate)}_${day(
      comparison.endDate,
    )}`,
    summary: [
      { label: 'Branches', value: String(comparison.branches.length) },
      { label: 'Brands', value: String(comparison.rows.length) },
      {
        label: 'Total revenue',
        value: formatCurrency(comparison.totalRevenue),
      },
      { label: 'Margin', value: `${comparison.marginPct}%` },
    ],
  }

  return { rows, columns, meta }
}
