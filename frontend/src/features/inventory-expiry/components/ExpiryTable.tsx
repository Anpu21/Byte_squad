import { CalendarClock } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import type { IExpiryReportRow } from '@/types'
import { ExpirySeverityPill } from './ExpirySeverityPill'
import { daysLabel } from '../lib/severity'

interface ExpiryTableProps {
  rows: IExpiryReportRow[]
  isLoading: boolean
}

export function ExpiryTable({ rows, isLoading }: ExpiryTableProps) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-10 bg-surface-2 rounded-md animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock size={20} />}
        title="No expiring batches"
        description="Nothing is due to expire within the selected window. Receive a batch with an expiry date to start tracking."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2 border-b border-border">
            <th className="px-5 py-2.5 font-semibold">Product</th>
            <th className="px-5 py-2.5 font-semibold">Batch</th>
            <th className="px-5 py-2.5 font-semibold">Branch</th>
            <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
              Expiry
            </th>
            <th className="px-5 py-2.5 font-semibold text-right whitespace-nowrap">
              Days left
            </th>
            <th className="px-5 py-2.5 font-semibold text-right">Qty</th>
            <th className="px-5 py-2.5 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.batchId}
              className="border-b border-border last:border-0 hover:bg-surface-2/60 transition-colors"
            >
              <td className="px-5 py-3">
                <div className="text-[13px] font-medium text-text-1">
                  {row.productName}
                </div>
                <div className="text-[11px] text-text-3">{row.barcode}</div>
              </td>
              <td className="px-5 py-3 text-[13px] text-text-2">
                {row.batchNo ?? '—'}
              </td>
              <td className="px-5 py-3 text-[13px] text-text-2">
                {row.branchName}
              </td>
              <td className="px-5 py-3 text-[13px] text-text-1 whitespace-nowrap num">
                {row.expiryDate}
              </td>
              <td className="px-5 py-3 text-[13px] text-text-2 text-right whitespace-nowrap num">
                {daysLabel(row.daysToExpiry)}
              </td>
              <td className="px-5 py-3 text-[13px] text-text-1 text-right num">
                {row.quantity}
              </td>
              <td className="px-5 py-3">
                <ExpirySeverityPill severity={row.severity} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
