import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'
import type { IUpdateBrandPayload } from '@/types'

export function useUpdateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: IUpdateBrandPayload }) =>
      brandsService.update(id, payload),
    onSuccess: () => {
      toast.success('Brand updated')
      void qc.invalidateQueries({ queryKey: queryKeys.brands.all() })
    },
    onError: () => toast.error('Could not update the brand'),
  })
}
