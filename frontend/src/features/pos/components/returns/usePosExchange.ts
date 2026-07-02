import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'
import { returnsService } from '@/services/returns.service'
import { useReplacementItems } from '@/features/returns/hooks/useReplacementItems'
import {
  buildExchangePayment,
  settleExchange,
  type ExchangeTenderMethod,
} from '@/features/returns/lib/exchange-settlement'
import type { ICreateSalesReturnLine } from '@/types'

interface IUsePosExchangeArgs {
  saleId: string | null
  returnedValue: number
  hasReturnLines: boolean
  buildReturnLines: () => ICreateSalesReturnLine[]
  reason: string
  /** Called after a successful exchange (resets + closes the modal). */
  onDone: () => void
}

/**
 * Exchange-specific POS state layered on top of usePosReturn's returned-lines:
 * the replacement basket, the net-cash settlement + upcharge tender, and the
 * atomic exchange submit (idempotent, mirrors the POS checkout key rotation).
 */
export function usePosExchange({
  saleId,
  returnedValue,
  hasReturnLines,
  buildReturnLines,
  reason,
  onDone,
}: IUsePosExchangeArgs) {
  const queryClient = useQueryClient()
  const replacement = useReplacementItems()
  const [method, setMethod] = useState<ExchangeTenderMethod>('Cash')
  const [cashTendered, setCashTendered] = useState(0)
  const [busy, setBusy] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  )

  const settlement = settleExchange(returnedValue, replacement.total)
  const paymentValid =
    settlement.kind !== 'pay' ||
    method === 'Card' ||
    cashTendered + 1e-6 >= settlement.amount
  const canSubmit =
    hasReturnLines && replacement.count > 0 && paymentValid && !busy

  async function handleSubmit() {
    if (!saleId || !canSubmit) return
    setBusy(true)
    try {
      const result = await returnsService.exchange(
        {
          saleId,
          reason: reason.trim() || undefined,
          returnedLines: buildReturnLines(),
          replacementItems: replacement.toPayload(),
          payment: buildExchangePayment(settlement, method, cashTendered),
        },
        idempotencyKey,
      )
      toast.success(
        `Exchanged — replacement invoice ${result.replacementSale.invoiceNumber}`,
      )
      setIdempotencyKey(crypto.randomUUID())
      replacement.clear()
      setCashTendered(0)
      void queryClient.invalidateQueries({ queryKey: ['pos'] })
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
      void queryClient.invalidateQueries({ queryKey: ['ledger'] })
      void queryClient.invalidateQueries({ queryKey: ['returns'] })
      onDone()
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined
        toast.error(data?.message ?? 'Could not process the exchange')
      } else {
        toast.error('Could not process the exchange')
      }
    } finally {
      setBusy(false)
    }
  }

  return {
    replacement,
    method,
    setMethod,
    cashTendered,
    setCashTendered,
    settlement,
    canSubmit,
    busy,
    handleSubmit,
  }
}
