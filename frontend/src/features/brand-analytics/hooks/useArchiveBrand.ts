import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'

export function useArchiveBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => brandsService.archive(id),
    onSuccess: () => {
      toast.success('Brand archived')
      void qc.invalidateQueries({ queryKey: queryKeys.brands.all() })
    },
    onError: () => toast.error('Could not archive the brand'),
  })
}
