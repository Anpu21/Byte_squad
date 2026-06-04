import { ClipboardList } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import type { IStockAdjustment } from '@/types'
import { AdjustmentStatusPill } from './AdjustmentStatusPill'
import { reasonLabel } from '../lib/reason'

interface AdjustmentsTableProps {
  rows: IStockAdjustment[]
  isLoading: boolean
  canManage: boolean
  isMutating: boolean
  onApprove: (id: string) => void
  onReverse: (id: string) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdjustmentsTable({
  rows,
  isLoading,
  canManage,
  isMutating,
  onApprove,
  onReverse,
}: AdjustmentsTableProps) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 bg-surface-2 rounded-md animate-pulse" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList size={20} />}
        title="No stock adjustments"
        description="Record a stock-take, damage, theft, or expiry correction to see it here."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2 border-b border-border">
            <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Date</th>
            <th className="px-5 py-2.5 font-semibold">Product</th>
            <th className="px-5 py-2.5 font-semibold">Branch</th>
            <th className="px-5 py-2.5 font-semibold">Reason</th>
            <th className="px-5 py-2.5 font-semibold text-right whitespace-nowrap">
              Before → After
            </th>
            <th className="px-5 py-2.5 font-semibold text-right">Δ</th>
            <th className="px-5 py-2.5 font-semibold">Status</th>
            {canManage && (
              <th className="px-5 py-2.5 font-semibold text-right">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const negative = Number(row.difference) < 0
            return (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-surface-2/60 transition-colors"
              >
                <td className="px-5 py-3 text-[13px] text-text-2 whitespace-nowrap">
                  {formatDate(row.createdAt)}
                </td>
                <td className="px-5 py-3">
                  <div className="text-[13px] font-medium text-text-1">
                    {row.product?.name ?? '—'}
                  </div>
                  <div className="text-[11px] text-text-3">
                    {row.product?.barcode ?? ''}
                  </div>
                </td>
                <td className="px-5 py-3 text-[13px] text-text-2">
                  {row.branch?.name ?? '—'}
                </td>
                <td className="px-5 py-3 text-[13px] text-text-2">
                  {reasonLabel(row.reason)}
                </td>
                <td className="px-5 py-3 text-[13px] text-text-1 text-right whitespace-nowrap num">
                  {row.quantityBefore} → {row.physicalQuantity}
                </td>
                <td
                  className={`px-5 py-3 text-[13px] text-right num ${
                    negative ? 'text-danger' : 'text-accent-text'
                  }`}
                >
                  {negative ? '' : '+'}
                  {row.difference}
                </td>
                <td className="px-5 py-3">
                  <AdjustmentStatusPill status={row.status} />
                </td>
                {canManage && (
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {row.status === 'Pending' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isMutating}
                        onClick={() => onApprove(row.id)}
                      >
                        Approve
                      </Button>
                    )}
                    {row.status === 'Approved' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isMutating}
                        onClick={() => onReverse(row.id)}
                      >
                        Reverse
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
