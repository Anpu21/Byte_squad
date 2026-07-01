import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { stockAdjustmentsService } from '@/services/stock-adjustments.service'
import { queryKeys } from '@/lib/queryKeys'
import { useConfirm } from '@/hooks/useConfirm'
import type {
  IStockAdjustmentStatus,
  IStockAdjustmentsParams,
} from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

const PAGE_LIMIT = DEFAULT_PAGE_SIZE

type StatusFilter = IStockAdjustmentStatus | 'all'

export function useStockAdjustmentsPage() {
  const qc = useQueryClient()
  const confirm = useConfirm()
  const [status, setStatusState] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)

  const params: IStockAdjustmentsParams = {
    status: status === 'all' ? undefined : status,
    page,
    limit: PAGE_LIMIT,
  }

  const query = useQuery({
    queryKey: queryKeys.stockAdjustments.list(params),
    queryFn: () => stockAdjustmentsService.list(params),
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['stock-adjustments'] })
    void qc.invalidateQueries({ queryKey: ['inventory'] })
    void qc.invalidateQueries({ queryKey: ['expiry'] })
  }

  const approveMutation = useMutation({
    mutationFn: stockAdjustmentsService.approve,
    onSuccess: () => {
      toast.success('Adjustment approved')
      invalidate()
    },
    onError: () => toast.error('Could not approve the adjustment'),
  })

  const reverseMutation = useMutation({
    mutationFn: stockAdjustmentsService.reverse,
    onSuccess: () => {
      toast.success('Adjustment reversed')
      invalidate()
    },
    onError: () => toast.error('Could not reverse the adjustment'),
  })

  const setStatus = (next: StatusFilter) => {
    setStatusState(next)
    setPage(1)
  }

  const onApprove = async (id: string) => {
    const ok = await confirm({
      title: 'Approve adjustment?',
      body: 'This applies the counted quantity to on-hand stock.',
      confirmLabel: 'Approve',
    })
    if (ok) approveMutation.mutate(id)
  }

  const onReverse = async (id: string) => {
    const ok = await confirm({
      title: 'Reverse adjustment?',
      body: 'This undoes the stock change and records a compensating movement.',
      confirmLabel: 'Reverse',
      tone: 'danger',
    })
    if (ok) reverseMutation.mutate(id)
  }

  const data = query.data

  return {
    rows: data?.items ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    page,
    setPage,
    status,
    setStatus,
    isLoading: query.isLoading,
    isError: query.isError,
    onApprove,
    onReverse,
    isMutating: approveMutation.isPending || reverseMutation.isPending,
  }
}
