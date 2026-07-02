import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { returnsService } from '@/services/returns.service'
import { FRONTEND_ROUTES } from '@/constants/routes'
import { useReplacementItems } from './useReplacementItems'
import {
  buildExchangePayment,
  settleExchange,
  type ExchangeTenderMethod,
} from '../lib/exchange-settlement'
import type { ICreateExchangePayload, ICreateSalesReturnLine } from '@/types'

interface IUseReturnExchangeArgs {
  saleId: string | null
  returnedValue: number
  hasReturnLines: boolean
  buildReturnLines: () => ICreateSalesReturnLine[]
  reason: string
}

/**
 * Back-office exchange state: the replacement basket + net-cash settlement +
 * the atomic exchange mutation. Mirrors usePosExchange but uses the page's
 * mutation/navigate conventions (invalidate returns/inventory, back to /returns).
 */
export function useReturnExchange({
  saleId,
  returnedValue,
  hasReturnLines,
  buildReturnLines,
  reason,
}: IUseReturnExchangeArgs) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const replacement = useReplacementItems()
  const [method, setMethod] = useState<ExchangeTenderMethod>('Cash')
  const [cashTendered, setCashTendered] = useState(0)

  const settlement = settleExchange(returnedValue, replacement.total)
  const paymentValid =
    settlement.kind !== 'pay' ||
    method === 'Card' ||
    cashTendered + 1e-6 >= settlement.amount

  const mutation = useMutation({
    mutationFn: (payload: ICreateExchangePayload) =>
      returnsService.exchange(payload),
    onSuccess: (result) => {
      toast.success(
        `Exchanged — replacement invoice ${result.replacementSale.invoiceNumber}`,
      )
      void qc.invalidateQueries({ queryKey: ['returns'] })
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      void qc.invalidateQueries({ queryKey: ['pos'] })
      void qc.invalidateQueries({ queryKey: ['ledger'] })
      navigate(FRONTEND_ROUTES.RETURNS)
    },
    onError: () => toast.error('Could not process the exchange'),
  })

  const canSubmit =
    hasReturnLines &&
    replacement.count > 0 &&
    paymentValid &&
    !mutation.isPending

  const submit = () => {
    if (!saleId || !canSubmit) return
    mutation.mutate({
      saleId,
      reason: reason || undefined,
      returnedLines: buildReturnLines(),
      replacementItems: replacement.toPayload(),
      payment: buildExchangePayment(settlement, method, cashTendered),
    })
  }

  return {
    replacement,
    method,
    setMethod,
    cashTendered,
    setCashTendered,
    settlement,
    canSubmit,
    submit,
    isSubmitting: mutation.isPending,
  }
}
