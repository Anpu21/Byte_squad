import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { returnsService } from '@/services/returns.service'
import { queryKeys } from '@/lib/queryKeys'
import { FRONTEND_ROUTES } from '@/constants/routes'
import type { ICreateSalesReturnLine } from '@/types'

export interface LineDraft {
  good: string
  bad: string
  restock: boolean
}

const emptyDraft = (): LineDraft => ({ good: '', bad: '', restock: true })

export function useReturnWorkflow() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [invoiceInput, setInvoiceInput] = useState('')
  const [searchedInvoice, setSearchedInvoice] = useState('')
  const [drafts, setDrafts] = useState<Record<string, LineDraft>>({})
  const [reason, setReason] = useState('')

  const lookupQuery = useQuery({
    queryKey: queryKeys.returns.lookup(searchedInvoice),
    queryFn: () => returnsService.lookup(searchedInvoice),
    enabled: Boolean(searchedInvoice),
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: returnsService.create,
    onSuccess: () => {
      toast.success('Return processed')
      void qc.invalidateQueries({ queryKey: ['returns'] })
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      navigate(FRONTEND_ROUTES.RETURNS)
    },
    onError: () => toast.error('Could not process the return'),
  })

  const search = () => {
    const trimmed = invoiceInput.trim()
    if (trimmed) {
      setDrafts({})
      setSearchedInvoice(trimmed)
    }
  }

  const setDraft = (saleItemId: string, patch: Partial<LineDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [saleItemId]: { ...emptyDraft(), ...prev[saleItemId], ...patch },
    }))
  }

  const lookup = lookupQuery.data
  const lines = lookup?.lines ?? []

  const refundPreview = lines.reduce((sum, line) => {
    const draft = drafts[line.saleItemId]
    if (!draft) return sum
    const qty = (Number(draft.good) || 0) + (Number(draft.bad) || 0)
    const perUnit =
      line.quantitySold > 0 ? line.lineTotal / line.quantitySold : 0
    return sum + qty * perUnit
  }, 0)

  const buildLines = (): ICreateSalesReturnLine[] => {
    const result: ICreateSalesReturnLine[] = []
    for (const line of lines) {
      const draft = drafts[line.saleItemId]
      if (!draft) continue
      const good = Number(draft.good) || 0
      const bad = Number(draft.bad) || 0
      if (good + bad <= 0) continue
      result.push({
        saleItemId: line.saleItemId,
        goodQuantity: good,
        badQuantity: bad,
        restockGood: draft.restock,
      })
    }
    return result
  }

  const payloadLines = buildLines()

  const submit = () => {
    if (!lookup || payloadLines.length === 0) return
    createMutation.mutate({
      saleId: lookup.saleId,
      reason: reason || undefined,
      lines: payloadLines,
    })
  }

  return {
    invoiceInput,
    setInvoiceInput,
    search,
    lookup,
    isLooking: lookupQuery.isFetching,
    lookupError: lookupQuery.isError,
    lines,
    drafts,
    setDraft,
    reason,
    setReason,
    refundPreview,
    canSubmit: payloadLines.length > 0,
    submit,
    isSubmitting: createMutation.isPending,
    // Reused by the exchange mode (same returned-lines editor + refund basis).
    saleId: lookup?.saleId ?? null,
    buildReturnLines: buildLines,
    hasReturnLines: payloadLines.length > 0,
  }
}
