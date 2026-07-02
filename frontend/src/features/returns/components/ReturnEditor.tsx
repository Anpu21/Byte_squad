import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Segmented from '@/components/ui/Segmented'
import { formatCurrency } from '@/lib/utils'
import type {
  ICreateSalesReturnLine,
  IReturnableLine,
  ISaleReturnLookup,
} from '@/types'
import { ReturnLineRow } from './ReturnLineRow'
import { ReplacementItemsPicker } from './ReplacementItemsPicker'
import { ExchangeSettlementPanel } from './ExchangeSettlementPanel'
import type { LineDraft } from '../hooks/useReturnWorkflow'
import { useReturnExchange } from '../hooks/useReturnExchange'

type ReturnMode = 'refund' | 'exchange'
const MODE_OPTIONS: { label: string; value: ReturnMode }[] = [
  { label: 'Refund', value: 'refund' },
  { label: 'Exchange', value: 'exchange' },
]

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
  saleId: string | null
  buildReturnLines: () => ICreateSalesReturnLine[]
  hasReturnLines: boolean
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
  saleId,
  buildReturnLines,
  hasReturnLines,
}: ReturnEditorProps) {
  const [mode, setMode] = useState<ReturnMode>('refund')
  const x = useReturnExchange({
    saleId,
    returnedValue: refundPreview,
    hasReturnLines,
    buildReturnLines,
    reason,
  })

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

      <div className="px-5 pt-4">
        <Segmented value={mode} options={MODE_OPTIONS} onChange={setMode} />
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

        {mode === 'refund' ? (
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
        ) : (
          <div className="space-y-3">
            <ReplacementItemsPicker
              lines={x.replacement.lines}
              total={x.replacement.total}
              onAdd={x.replacement.addFromSearch}
              onSetQuantity={x.replacement.setQuantity}
              onSetUnit={x.replacement.setUnit}
              onRemove={x.replacement.removeItem}
            />
            <ExchangeSettlementPanel
              returnedValue={refundPreview}
              replacementValue={x.replacement.total}
              method={x.method}
              onMethodChange={x.setMethod}
              cashTendered={x.cashTendered}
              onCashTenderedChange={x.setCashTendered}
            />
            <div className="flex justify-end">
              <Button onClick={x.submit} disabled={!x.canSubmit}>
                {x.isSubmitting ? 'Processing…' : 'Process exchange'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
