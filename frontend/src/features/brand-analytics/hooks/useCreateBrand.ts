import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'
import type { ICreateBrandPayload } from '@/types'

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ICreateBrandPayload) => brandsService.create(payload),
    onSuccess: () => {
      toast.success('Brand created')
      void qc.invalidateQueries({ queryKey: queryKeys.brands.all() })
    },
    onError: () => toast.error('Could not create the brand'),
  })
}
