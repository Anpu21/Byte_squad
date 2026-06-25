import type { IReturnableLine } from '@/types'
import type { LineDraft } from '../hooks/useReturnWorkflow'

interface ReturnLineRowProps {
  line: IReturnableLine
  draft: LineDraft | undefined
  onChange: (patch: Partial<LineDraft>) => void
}

const QTY_CLASS =
  'w-20 h-[34px] px-2 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 text-right outline-none focus:border-focus focus:ring-[3px] focus:ring-primary/30 num disabled:opacity-50'

export function ReturnLineRow({ line, draft, onChange }: ReturnLineRowProps) {
  const good = draft?.good ?? ''
  const bad = draft?.bad ?? ''
  const restock = draft?.restock ?? true
  const disabled = line.remaining <= 0

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-5 py-3">
        <div className="text-[13px] font-medium text-text-1">
          {line.productName}
        </div>
        <div className="text-[11px] text-text-3">
          {line.barcode}
          {line.unitLabel ? ` · ${line.unitLabel}` : ''}
        </div>
      </td>
      <td className="px-5 py-3 text-[13px] text-right text-text-2 num whitespace-nowrap">
        {line.remaining} / {line.quantitySold}
      </td>
      <td className="px-3 py-3 text-right">
        <input
          type="number"
          min="0"
          step="0.001"
          max={line.remaining}
          className={QTY_CLASS}
          placeholder="0"
          value={good}
          disabled={disabled}
          onChange={(e) => onChange({ good: e.target.value })}
        />
      </td>
      <td className="px-3 py-3 text-right">
        <input
          type="number"
          min="0"
          step="0.001"
          max={line.remaining}
          className={QTY_CLASS}
          placeholder="0"
          value={bad}
          disabled={disabled}
          onChange={(e) => onChange({ bad: e.target.value })}
        />
      </td>
      <td className="px-5 py-3 text-center">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary cursor-pointer disabled:opacity-50"
          checked={restock}
          disabled={disabled}
          onChange={(e) => onChange({ restock: e.target.checked })}
          aria-label={`Restock good units of ${line.productName}`}
        />
      </td>
    </tr>
  )
}
