import { useEffect, useMemo, useState } from 'react'
import { LuSearch as Search } from 'react-icons/lu'
import {
  DataTable,
  EmptyState,
  Segmented,
  type DataTableColumn,
} from '@/components/ui'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { CHART_COLORS } from '@/components/charts/chart-palette'
import { formatCurrency } from '@/lib/utils'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { useCategoryProducts } from '../hooks/useCategoryProducts'
import type {
  IBrandAnalyticsParams,
  ICategoryBrandRow,
  ICategoryProductRow,
  ICategoryProductSort,
  ICategoryProductsParams,
} from '@/types'

const METRIC_OPTIONS: { label: string; value: ICategoryProductSort }[] = [
  { label: 'Revenue', value: 'revenue' },
  { label: 'Units', value: 'units' },
  { label: 'Profit', value: 'profit' },
]
const sliceColor = (i: number) => CHART_COLORS[i % CHART_COLORS.length]

interface CategoryProductRosterProps {
  categoryId: string
  params: IBrandAnalyticsParams
  brands: ICategoryBrandRow[]
}

/** Paginated, brand-tagged product roster for one category (server-sorted). */
export function CategoryProductRoster({
  categoryId,
  params,
  brands,
}: CategoryProductRosterProps) {
  const [sort, setSort] = useState<ICategoryProductSort>('revenue')
  const [searchInput, setSearchInput] = useState('')
  const [brandId, setBrandId] = useState('')
  const [page, setPage] = useState(1)
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(searchInput), 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const rosterParams = useMemo<ICategoryProductsParams>(
    () => ({
      ...params,
      sort,
      search: debounced.trim() || undefined,
      brandId: brandId || undefined,
      page,
      limit: DEFAULT_PAGE_SIZE,
    }),
    [params, sort, debounced, brandId, page],
  )

  const { data, isLoading } = useCategoryProducts(categoryId, rosterParams)
  const items = data?.items ?? []

  const brandOptions = [
    { label: 'All brands', value: '' },
    ...brands
      .filter((b) => b.brandId)
      .map((b) => ({ label: b.brandName, value: b.brandId as string })),
  ]

  const columns: DataTableColumn<ICategoryProductRow>[] = [
    {
      key: 'product',
      header: 'Product',
      className: 'font-medium text-text-1',
      render: (r) => r.productName,
    },
    {
      key: 'brand',
      header: 'Brand',
      render: (r, i) => (
        <span className="inline-flex items-center gap-2 text-text-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: r.color ?? (r.brandId ? sliceColor(i) : 'var(--text-3)'),
            }}
          />
          {r.brandName ?? 'Unbranded'}
        </span>
      ),
    },
    {
      key: 'units',
      header: 'Units',
      align: 'right',
      numeric: true,
      render: (r) => Math.round(r.units),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      numeric: true,
      render: (r) => formatCurrency(r.revenue),
    },
    {
      key: 'profit',
      header: 'Profit',
      align: 'right',
      numeric: true,
      render: (r) => formatCurrency(r.profit),
    },
    {
      key: 'margin',
      header: 'Margin',
      align: 'right',
      numeric: true,
      render: (r) => `${r.marginPct}%`,
    },
    {
      key: 'share',
      header: 'Share',
      align: 'right',
      numeric: true,
      render: (r) => `${r.sharePct}%`,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={sort}
          options={METRIC_OPTIONS}
          onChange={(value) => {
            setSort(value)
            setPage(1) // re-rank → back to page 1
          }}
        />
        <div className="flex flex-col sm:flex-row gap-2.5">
          {brandOptions.length > 1 && (
            <Select
              value={brandId}
              onChange={(value) => {
                setBrandId(value)
                setPage(1)
              }}
              aria-label="Filter products by brand"
              options={brandOptions}
            />
          )}
          <div className="sm:w-56">
            <Input
              aria-label="Search products"
              placeholder="Search products…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
              leftIcon={<Search size={15} />}
            />
          </div>
        </div>
      </div>

      <DataTable<ICategoryProductRow>
        columns={columns}
        rows={items}
        getRowKey={(r) => r.productId}
        isLoading={isLoading}
        zebra
        empty={
          <EmptyState
            title="No products match"
            description="Try a different brand, metric, or search term."
          />
        }
        footer={
          <Pagination
            page={data?.page ?? page}
            pageSize={data?.limit ?? DEFAULT_PAGE_SIZE}
            total={data?.total ?? 0}
            onPageChange={setPage}
            unit="products"
          />
        }
      />
    </div>
  )
}
