import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { stockAdjustmentsService } from '@/services/stock-adjustments.service'
import { FRONTEND_ROUTES } from '@/constants/routes'
import type { ICreateStockAdjustmentPayload } from '@/types'

export function useStockAdjustmentCreate() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: ICreateStockAdjustmentPayload) =>
      stockAdjustmentsService.create(payload),
    onSuccess: (created) => {
      toast.success(
        created.status === 'Pending'
          ? 'Adjustment submitted for approval'
          : 'Adjustment recorded',
      )
      void qc.invalidateQueries({ queryKey: ['stock-adjustments'] })
      void qc.invalidateQueries({ queryKey: ['inventory'] })
      navigate(FRONTEND_ROUTES.STOCK_ADJUSTMENTS)
    },
    onError: () => toast.error('Could not record the adjustment'),
  })

  return {
    submit: (payload: ICreateStockAdjustmentPayload) =>
      mutation.mutate(payload),
    isSubmitting: mutation.isPending,
  }
}
