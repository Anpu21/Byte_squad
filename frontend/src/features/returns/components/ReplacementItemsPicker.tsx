import { usePosItemSearch } from '@/features/pos/hooks/usePosItemSearch'
import { PosItemSearchInput } from '@/features/pos/components/item-table/PosItemSearchInput'
import { PosItemSearchResults } from '@/features/pos/components/item-table/PosItemSearchResults'
import { PosUnitSelect } from '@/features/pos/components/item-table/PosUnitSelect'
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { IProductUnitRow, ISearchProductRow } from '@/types'
import type { ReplacementLine } from '../hooks/useReplacementItems'

interface IReplacementItemsPickerProps {
  lines: ReplacementLine[]
  total: number
  onAdd: (row: ISearchProductRow) => void
  onSetQuantity: (rowId: string, quantity: number) => void
  onSetUnit: (rowId: string, unit: IProductUnitRow) => void
  onRemove: (rowId: string) => void
}

/**
 * Shared replacement-basket picker for an exchange (goods out). Product search →
 * unit + quantity per line → running total. Reuses the POS search/unit
 * primitives so pricing matches the server. Used by both the POS return modal
 * and the back-office return flow.
 */
export function ReplacementItemsPicker({
  lines,
  total,
  onAdd,
  onSetQuantity,
  onSetUnit,
  onRemove,
}: IReplacementItemsPickerProps) {
  const search = usePosItemSearch(onAdd)

  return (
    <div className="space-y-3">
      <div className="relative">
        <PosItemSearchInput
          value={search.query}
          onChange={search.onQueryChange}
          placeholder="Search a replacement product…"
          isSearching={search.isFetching}
        />
        <PosItemSearchResults
          results={search.results}
          onSelect={search.selectRow}
          isLoading={search.isFetching}
          query={search.debounced}
          highlightIndex={search.highlight}
        />
      </div>

      {lines.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-text-3">
          No replacement items yet — search above to add what the customer takes.
        </p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line) => (
            <li
              key={line.rowId}
              className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2"
            >
              <span className="min-w-[8rem] flex-1 text-sm font-medium text-text-1">
                {line.productName}
              </span>
              <PosUnitSelect
                productId={line.productId}
                value={line.unitId}
                onChange={(unit) => onSetUnit(line.rowId, unit)}
                className="w-32"
              />
              <input
                type="number"
                min={0}
                step="0.001"
                inputMode="decimal"
                aria-label={`Quantity for ${line.productName}`}
                value={line.quantity}
                onChange={(e) =>
                  onSetQuantity(line.rowId, Number(e.target.value) || 0)
                }
                className={`${FIELD_SHELL} ${FIELD_BORDER} w-20 text-right`}
              />
              <span className="w-24 text-right text-sm num text-text-1">
                {formatCurrency(line.lineTotal)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(line.rowId)}
                aria-label={`Remove ${line.productName}`}
                className="rounded-md px-2 py-1 text-sm text-danger hover:bg-danger-soft"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
        <span className="text-text-3">Replacement total</span>
        <span className="font-semibold num text-text-1">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  )
}
