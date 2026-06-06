import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { categoriesService } from '@/services/categories.service'
import { queryKeys } from '@/lib/queryKeys'
import type { ICreateCategoryPayload } from '@/types'

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ICreateCategoryPayload) =>
      categoriesService.create(payload),
    onSuccess: () => {
      toast.success('Category created')
      void qc.invalidateQueries({ queryKey: queryKeys.categories.all() })
    },
    onError: () => toast.error('Could not create the category'),
  })
}
