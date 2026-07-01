import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'

/** Surface the API's message (e.g. the 409 "in use; archive instead" guard). */
function apiMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const message = (err as { response?: { data?: { message?: unknown } } })
      .response?.data?.message
    if (typeof message === 'string') return message
  }
  return fallback
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => brandsService.remove(id),
    onSuccess: () => {
      toast.success('Brand deleted')
      void qc.invalidateQueries({ queryKey: queryKeys.brands.all() })
    },
    onError: (err) => toast.error(apiMessage(err, 'Could not delete the brand')),
  })
}
