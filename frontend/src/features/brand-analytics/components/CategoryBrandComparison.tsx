import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { EmptyState } from '@/components/ui'
import { Select } from '@/components/ui/Select'
import { categoriesService } from '@/services/categories.service'
import { queryKeys } from '@/lib/queryKeys'
import { CategoryBrandLeaderboard } from './CategoryBrandLeaderboard'
import { CategoryProductRoster } from './CategoryProductRoster'
import { useCategoryComparison } from '../hooks/useCategoryComparison'
import type { IBrandAnalyticsParams } from '@/types'

interface CategoryBrandComparisonProps {
  params: IBrandAnalyticsParams
}

/**
 * "By category" tab: pick a category, then compare the brands selling within it
 * (leaderboard + charts) and browse its brand-tagged product roster.
 */
export function CategoryBrandComparison({
  params,
}: CategoryBrandComparisonProps) {
  const [categoryId, setCategoryId] = useState('')
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(false),
    queryFn: () => categoriesService.list(false),
    staleTime: 5 * 60_000,
  })
  const categories = categoriesQuery.data ?? []
  const options = [
    { label: 'Select a category…', value: '' },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ]

  // Shared with the leaderboard (deduped by React Query) — powers the roster's
  // brand filter options.
  const { data: comparison } = useCategoryComparison(categoryId || null, params)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-text-2 mb-1.5">
            Category
          </label>
          <Select
            value={categoryId}
            onChange={setCategoryId}
            aria-label="Category"
            options={options}
          />
        </div>
      </div>

      {!categoryId ? (
        <EmptyState
          title="Pick a category"
          description="Choose a category to compare the brands selling within it."
        />
      ) : (
        <>
          <CategoryBrandLeaderboard categoryId={categoryId} params={params} />
          <CategoryProductRoster
            categoryId={categoryId}
            params={params}
            brands={comparison?.brands ?? []}
          />
        </>
      )}
    </div>
  )
}
