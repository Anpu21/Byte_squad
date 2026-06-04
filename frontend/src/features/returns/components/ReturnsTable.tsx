import { Undo2 } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/utils'
import type { ISalesReturn } from '@/types'

interface ReturnsTableProps {
  rows: ISalesReturn[]
  isLoading: boolean
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ReturnsTable({ rows, isLoading }: ReturnsTableProps) {
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
        icon={<Undo2 size={20} />}
        title="No returns yet"
        description="Process a return by looking up a sale invoice."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2 border-b border-border">
            <th className="px-5 py-2.5 font-semibold whitespace-nowrap">Date</th>
            <th className="px-5 py-2.5 font-semibold">Invoice</th>
            <th className="px-5 py-2.5 font-semibold">Branch</th>
            <th className="px-5 py-2.5 font-semibold text-right">Lines</th>
            <th className="px-5 py-2.5 font-semibold text-right whitespace-nowrap">
              Restocked
            </th>
            <th className="px-5 py-2.5 font-semibold text-right whitespace-nowrap">
              Refund
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0 hover:bg-surface-2/60 transition-colors"
            >
              <td className="px-5 py-3 text-[13px] text-text-2 whitespace-nowrap">
                {formatDate(row.createdAt)}
              </td>
              <td className="px-5 py-3 text-[13px] font-medium text-text-1">
                {row.invoiceNumber}
              </td>
              <td className="px-5 py-3 text-[13px] text-text-2">
                {row.branch?.name ?? '—'}
              </td>
              <td className="px-5 py-3 text-[13px] text-text-2 text-right num">
                {row.items?.length ?? '—'}
              </td>
              <td className="px-5 py-3 text-[13px] text-text-2 text-right num">
                {formatCurrency(Number(row.restockedValue))}
              </td>
              <td className="px-5 py-3 text-[13px] text-danger text-right num">
                {formatCurrency(Number(row.totalRefundAmount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
