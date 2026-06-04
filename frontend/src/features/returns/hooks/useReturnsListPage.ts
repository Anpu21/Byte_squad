import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { returnsService } from '@/services/returns.service'
import { queryKeys } from '@/lib/queryKeys'
import type { IReturnsParams } from '@/types'

const PAGE_LIMIT = 20

export function useReturnsListPage() {
  const [page, setPage] = useState(1)
  const params: IReturnsParams = { page, limit: PAGE_LIMIT }

  const query = useQuery({
    queryKey: queryKeys.returns.list(params),
    queryFn: () => returnsService.list(params),
  })

  const data = query.data

  return {
    rows: data?.items ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    page,
    setPage,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
