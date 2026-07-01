import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import ExportMenu from '@/components/common/ExportMenu'
import { Select } from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { adminService } from '@/services/admin.service'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/hooks/useAuth'
import { useCategoryAnalyticsQuery } from '../hooks/useCategoryAnalyticsQuery'
import { exportCategoryAnalytics } from '../lib/export-category-analytics'
import type { ExportFormat } from '@/lib/exportUtils'
import { CATEGORY_COLUMNS } from './category-analytics-columns'
import { CategoryAnalyticsResults } from './CategoryAnalyticsResults'

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

interface CategoryAnalyticsTabProps {
  isAdmin: boolean
}

export function CategoryAnalyticsTab({ isAdmin }: CategoryAnalyticsTabProps) {
  const { user } = useAuth()
  const [startDate, setStartDate] = useState(() => daysAgoIso(30))
  const [endDate, setEndDate] = useState(() => todayIso())
  const [branchId, setBranchId] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const branchesQuery = useQuery({
    queryKey: queryKeys.admin.branches(),
    queryFn: adminService.listBranches,
    enabled: isAdmin,
    staleTime: 5 * 60_000,
  })

  const params = useMemo(
    () => ({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(`${endDate}T23:59:59`).toISOString(),
      branchId: isAdmin && branchId ? branchId : undefined,
    }),
    [startDate, endDate, branchId, isAdmin],
  )

  const { data, isLoading } = useCategoryAnalyticsQuery(params)
  const rows = data?.rows ?? []

  const scopeLabel = isAdmin
    ? branchId
      ? (branchesQuery.data?.find((b) => b.id === branchId)?.name ??
        'Selected branch')
      : 'All branches'
    : 'My branch'
  const rangeLabel = `${startDate} → ${endDate}`

  const handleExport = async (format: ExportFormat) => {
    if (rows.length === 0) return
    try {
      setIsExporting(true)
      await exportCategoryAnalytics({
        rows,
        format,
        scopeLabel,
        rangeLabel,
        totals: {
          totalRevenue: data?.totalRevenue ?? 0,
          totalUnits: data?.totalUnits ?? 0,
          totalTransactions: data?.totalTransactions ?? 0,
        },
        user: user
          ? { firstName: user.firstName, lastName: user.lastName }
          : null,
      })
      toast.success(
        format === 'pdf' ? 'PDF download started' : 'Excel download started',
      )
    } catch {
      toast.error('Could not generate export — please try again')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-text-2 mb-1.5">
            From
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-2 mb-1.5">
            To
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto"
          />
        </div>
        {isAdmin && (
          <div>
            <label className="block text-xs font-medium text-text-2 mb-1.5">
              Branch
            </label>
            <Select
              value={branchId}
              onChange={setBranchId}
              aria-label="Branch filter"
              options={[
                { label: 'All branches', value: '' },
                ...(branchesQuery.data ?? []).map((b) => ({
                  label: b.name,
                  value: b.id,
                })),
              ]}
            />
          </div>
        )}
        <div className="ml-auto">
          <ExportMenu
            onExport={handleExport}
            disabled={rows.length === 0}
            isPreparing={isExporting}
          />
        </div>
      </div>

      <CategoryAnalyticsResults
        data={data}
        rows={rows}
        isLoading={isLoading}
        columns={CATEGORY_COLUMNS}
      />
    </div>
  )
}
