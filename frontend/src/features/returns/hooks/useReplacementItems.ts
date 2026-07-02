import { useCallback, useMemo, useState } from 'react'
import { computeLine } from '@/features/pos/lib/line-total'
import { toCartItemSeed } from '@/features/pos/lib/cart-item-seed'
import type {
  IProductUnitRow,
  IReplacementItemInput,
  ISearchProductRow,
} from '@/types'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export interface ReplacementDraft {
  rowId: string
  productId: string
  productName: string
  baseUnit: string
  unitId: string | null
  unitName: string
  unitPrice: number
  conversionFactor: number
  quantity: number
  taxRate: number
  discountPercentage: number
}

export interface ReplacementLine extends ReplacementDraft {
  lineTotal: number
}

function keyOf(productId: string, unitId: string | null): string {
  return `${productId}::${unitId ?? 'base'}`
}

/**
 * In-memory replacement basket for an exchange (goods out). Reuses the POS
 * server-authoritative pricing (`toCartItemSeed` + `computeLine`) so the total
 * matches the backend's `computeReplacement`. Not persisted — it lives only for
 * the modal/page session.
 */
export function useReplacementItems() {
  const [drafts, setDrafts] = useState<ReplacementDraft[]>([])

  const addFromSearch = useCallback((row: ISearchProductRow) => {
    const seed = toCartItemSeed(row)
    setDrafts((prev) => {
      const key = keyOf(seed.productId, seed.unitId)
      const idx = prev.findIndex((d) => keyOf(d.productId, d.unitId) === key)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return next
      }
      return [
        ...prev,
        {
          rowId: crypto.randomUUID(),
          productId: seed.productId,
          productName: seed.productName,
          baseUnit: seed.baseUnit,
          unitId: seed.unitId,
          unitName: seed.unitName,
          unitPrice: seed.unitPrice,
          conversionFactor: seed.conversionFactor,
          quantity: seed.quantity,
          taxRate: seed.taxRate,
          discountPercentage: seed.discountPercentage,
        },
      ]
    })
  }, [])

  const setQuantity = useCallback((rowId: string, quantity: number) => {
    setDrafts((prev) =>
      prev.map((d) => (d.rowId === rowId ? { ...d, quantity } : d)),
    )
  }, [])

  const setUnit = useCallback((rowId: string, unit: IProductUnitRow) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.rowId === rowId
          ? {
              ...d,
              unitId: unit.isBaseUnit ? null : unit.unitId,
              unitName: unit.unitName,
              unitPrice: unit.sellingPrice,
              conversionFactor: unit.conversionToBase,
            }
          : d,
      ),
    )
  }, [])

  const removeItem = useCallback((rowId: string) => {
    setDrafts((prev) => prev.filter((d) => d.rowId !== rowId))
  }, [])

  const clear = useCallback(() => setDrafts([]), [])

  const lines = useMemo<ReplacementLine[]>(
    () =>
      drafts.map((d) => ({
        ...d,
        lineTotal: computeLine({
          quantity: d.quantity,
          free: 0,
          unitPrice: d.unitPrice,
          discountPercentage: d.discountPercentage,
          taxRate: d.taxRate,
          conversionFactor: d.conversionFactor,
        }).lineTotal,
      })),
    [drafts],
  )

  const total = useMemo(
    () => round2(lines.reduce((sum, l) => sum + l.lineTotal, 0)),
    [lines],
  )

  const toPayload = useCallback(
    (): IReplacementItemInput[] =>
      drafts.map((d) => ({
        productId: d.productId,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        unitId: d.unitId,
        taxRate: d.taxRate,
        discountPercentage: d.discountPercentage,
      })),
    [drafts],
  )

  return {
    lines,
    total,
    count: drafts.length,
    addFromSearch,
    setQuantity,
    setUnit,
    removeItem,
    clear,
    toPayload,
  }
}
