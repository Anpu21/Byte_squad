import { LuStar as Star } from 'react-icons/lu'
import Card from '@/components/ui/Card'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import EmptyState from '@/components/ui/EmptyState'
import type { BrandBranchMetric, IBrandBranchOption } from '@/types'
import type { BrandBranchMatrixRow } from '../lib/brand-branch-data'

interface BrandBranchMatrixTableProps {
  rows: BrandBranchMatrixRow[]
  branches: IBrandBranchOption[]
  metric: BrandBranchMetric
  branchColorFor: (branchId: string) => string
  format: (value: number) => string
  onSelectBrand: (brandId: string) => void
  isLoading: boolean
}

/**
 * The brand × branch matrix. One numeric column per selected branch (leader
 * cell bold), a total, share, and the leader's margin over the runner-up.
 * Clicking a brand row drills into its per-product breakdown; the Unbranded
 * bucket has nothing to drill into, so its row is muted and inert.
 */
export function BrandBranchMatrixTable({
  rows,
  branches,
  metric,
  branchColorFor,
  format,
  onSelectBrand,
  isLoading,
}: BrandBranchMatrixTableProps) {
  const noun =
    metric === 'units' ? 'units' : metric === 'profit' ? 'profit' : 'revenue'

  const branchColumns: DataTableColumn<BrandBranchMatrixRow>[] = branches.map(
    (branch) => ({
      key: branch.branchId,
      align: 'right',
      numeric: true,
      header: (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2 flex-none rounded-full"
            style={{ backgroundColor: branchColorFor(branch.branchId) }}
            aria-hidden="true"
          />
          {branch.branchName}
        </span>
      ),
      render: (row) => {
        const cell = row.perBranch.find((c) => c.branchId === branch.branchId)
        if (!cell) return <span className="text-text-3">—</span>
        return (
          <span
            className={
              cell.isLeader ? 'font-semibold text-text-1' : 'text-text-2'
            }
          >
            {format(cell.value)}
          </span>
        )
      },
    }),
  )

  const columns: DataTableColumn<BrandBranchMatrixRow>[] = [
    {
      key: 'brand',
      header: 'Brand',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-2 font-medium ${
            row.brandId ? 'text-text-1' : 'text-text-3'
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: row.color ?? 'var(--border-strong)' }}
            aria-hidden="true"
          />
          {row.brandName}
        </span>
      ),
    },
    ...branchColumns,
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      numeric: true,
      render: (row) => (
        <span className="font-semibold text-text-1">{format(row.total)}</span>
      ),
    },
    {
      key: 'share',
      header: 'Share',
      align: 'right',
      numeric: true,
      render: (row) => `${row.sharePct}%`,
    },
    {
      key: 'lead',
      header: 'Lead vs 2nd',
      align: 'right',
      numeric: true,
      render: (row) =>
        row.leaderBranchId && row.leadGap > 0 ? (
          <span className="inline-flex items-center gap-1 text-accent-text">
            <Star size={11} fill="currentColor" aria-hidden="true" />
            {(row.leadGap * 100).toFixed(0)}%
          </span>
        ) : (
          <span className="text-text-3">—</span>
        ),
    },
  ]

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-surface-2/40 px-5 py-3.5">
        <p className="text-[13px] font-semibold tracking-tight text-text-1">
          Brand × branch breakdown
        </p>
        <p className="mt-0.5 text-[11px] text-text-3">
          Every brand's {noun} in every selected branch — the leading branch is
          bold. Click a brand to see its products per branch.
        </p>
      </div>
      <DataTable<BrandBranchMatrixRow>
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.key}
        onRowClick={(row) => {
          // The Unbranded bucket can't be drilled into (no brand id).
          if (row.brandId) onSelectBrand(row.brandId)
        }}
        getRowLabel={(row) =>
          row.brandId
            ? `View ${row.brandName} products per branch`
            : 'Unbranded products (no drill-down)'
        }
        isLoading={isLoading}
        stickyHeader
        zebra
        clientPaginate={{ unit: 'brands' }}
        empty={
          <EmptyState
            title="No sales in the selected branches"
            description="Widen the date range or pick different branches."
          />
        }
      />
    </Card>
  )
}
