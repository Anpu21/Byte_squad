import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { brandsService } from '@/services/brands.service'
import { queryKeys } from '@/lib/queryKeys'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import type {
  BrandBranchMetric,
  IBrandBranchProductsRequest,
  IBrandBranchProductsResponse,
} from '@/types'

/** Matches the app's auto-refresh feel (branch-comparison uses the same). */
const SEARCH_DEBOUNCE_MS = 450

export interface UseBrandBranchProductsArgs {
  branchIds: string[]
  startDate: string
  endDate: string
  brandId: string
}

export interface UseBrandBranchProductsResult {
  data: IBrandBranchProductsResponse | undefined
  isLoading: boolean
  isRefreshing: boolean
  searchInput: string
  setSearch: (value: string) => void
  sort: BrandBranchMetric
  setSort: (value: BrandBranchMetric) => void
  page: number
  setPage: (value: number) => void
}

/**
 * Data hook for the brand drilldown's product×branch matrix. Branch set + date
 * range + brand ride in from the parent tab; this hook owns the product-scoped
 * controls — debounced search / sort (= metric) / page. Changing search or
 * sort resets to page 1 (plain state, matching the page's useState tab style).
 */
export function useBrandBranchProducts({
  branchIds,
  startDate,
  endDate,
  brandId,
}: UseBrandBranchProductsArgs): UseBrandBranchProductsResult {
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSortState] = useState<BrandBranchMetric>('revenue')
  const [page, setPage] = useState(1)

  const setSearch = (value: string) => {
    setSearchInput(value)
    setPage(1) // new query → back to page 1
  }
  const setSort = (value: BrandBranchMetric) => {
    setSortState(value)
    setPage(1) // re-rank → back to page 1
  }

  // Debounce the free-text search so each keystroke doesn't refetch.
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput)
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(searchInput),
      SEARCH_DEBOUNCE_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [searchInput])

  const request = useMemo<IBrandBranchProductsRequest | null>(() => {
    if (branchIds.length === 0 || !brandId) return null
    return {
      branchIds,
      startDate,
      endDate,
      brandId,
      search: debouncedSearch.trim() || undefined,
      sort,
      page,
      limit: DEFAULT_PAGE_SIZE,
    }
  }, [branchIds, startDate, endDate, brandId, debouncedSearch, sort, page])

  const query = useQuery({
    queryKey: queryKeys.brands.byBranchProducts(request),
    queryFn: () => brandsService.getBranchProducts(request!),
    enabled: request !== null,
    placeholderData: (previous) => previous,
  })

  const isDebouncing = debouncedSearch !== searchInput

  return {
    data: query.data,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching || isDebouncing,
    searchInput,
    setSearch,
    sort,
    setSort,
    page,
    setPage,
  }
}
