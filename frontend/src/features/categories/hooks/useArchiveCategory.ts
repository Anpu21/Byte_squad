import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { categoriesService } from '@/services/categories.service'
import { queryKeys } from '@/lib/queryKeys'

export function useArchiveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoriesService.archive(id),
    onSuccess: () => {
      toast.success('Category archived')
      void qc.invalidateQueries({ queryKey: queryKeys.categories.all() })
    },
    onError: () => toast.error('Could not archive the category'),
  })
}
