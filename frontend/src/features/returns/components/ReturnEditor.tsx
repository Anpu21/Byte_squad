import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import type { IReturnableLine, ISaleReturnLookup } from '@/types'
import { ReturnLineRow } from './ReturnLineRow'
import type { LineDraft } from '../hooks/useReturnWorkflow'

interface ReturnEditorProps {
  lookup: ISaleReturnLookup
  lines: IReturnableLine[]
  drafts: Record<string, LineDraft>
  setDraft: (saleItemId: string, patch: Partial<LineDraft>) => void
  reason: string
  setReason: (value: string) => void
  refundPreview: number
  canSubmit: boolean
  submit: () => void
  isSubmitting: boolean
}

export function ReturnEditor({
  lookup,
  lines,
  drafts,
  setDraft,
  reason,
  setReason,
  refundPreview,
  canSubmit,
  submit,
  isSubmitting,
}: ReturnEditorProps) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="text-[13px] text-text-2">
          Invoice{' '}
          <span className="font-medium text-text-1">{lookup.invoiceNumber}</span>
        </div>
        <div className="text-[13px] text-text-2">
          Sale total {formatCurrency(Number(lookup.total))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2 border-b border-border">
              <th className="px-5 py-2.5 font-semibold">Product</th>
              <th className="px-5 py-2.5 font-semibold text-right whitespace-nowrap">
                Remaining
              </th>
              <th className="px-3 py-2.5 font-semibold text-right">Good</th>
              <th className="px-3 py-2.5 font-semibold text-right">Bad</th>
              <th className="px-5 py-2.5 font-semibold text-center">Restock</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <ReturnLineRow
                key={line.saleItemId}
                line={line}
                draft={drafts[line.saleItemId]}
                onChange={(patch) => setDraft(line.saleItemId, patch)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 border-t border-border space-y-4">
        <Input
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-text-2">
            Estimated refund{' '}
            <span className="font-semibold text-text-1 num">
              {formatCurrency(refundPreview)}
            </span>
          </div>
          <Button onClick={submit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Processing…' : 'Process return'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
