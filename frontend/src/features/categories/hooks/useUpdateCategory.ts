import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { categoriesService } from '@/services/categories.service'
import { queryKeys } from '@/lib/queryKeys'
import type { IUpdateCategoryPayload } from '@/types'

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: IUpdateCategoryPayload
    }) => categoriesService.update(id, payload),
    onSuccess: () => {
      toast.success('Category updated')
      void qc.invalidateQueries({ queryKey: queryKeys.categories.all() })
    },
    onError: () => toast.error('Could not update the category'),
  })
}
