import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CHART_COLORS } from '@/components/charts/chart-palette'
import { EmptyState } from '@/components/ui'
import Card from '@/components/ui/Card'
import { exportData, type ExportFormat } from '@/lib/exportUtils'
import { queryKeys } from '@/lib/queryKeys'
import { adminService } from '@/services/admin.service'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/constants/enums'
import type { BrandBranchMetric, IBrandBranchComparisonRequest } from '@/types'
import { useBrandBranchComparison } from '../hooks/useBrandBranchComparison'
import { buildBrandBranchExport } from '../lib/build-brand-branch-export'
import { BrandBranchDrilldown } from './BrandBranchDrilldown'
import { BrandBranchLeaderboard } from './BrandBranchLeaderboard'
import { BrandBranchPicker } from './BrandBranchPicker'

interface BrandBranchComparisonProps {
  startDate: string
  endDate: string
}

/**
 * "By branch" tab: compare every brand across a set of branches. Owns the
 * branch multi-select (defaulting to ALL active branches — the tab's whole
 * point), the leaderboard↔drilldown swap, and the PDF/Excel export. Managers
 * see it too: their own branch is locked in, extra branches are welcome
 * (cross-branch by design, matching Branch Compare).
 */
export function BrandBranchComparison({
  startDate,
  endDate,
}: BrandBranchComparisonProps) {
  const { user } = useAuth()
  const lockedBranchIds = useMemo(
    () =>
      user?.role === UserRole.MANAGER && user.branchId ? [user.branchId] : [],
    [user],
  )

  // Same roster endpoint Branch Compare uses — visible to managers as well.
  const branchesQuery = useQuery({
    queryKey: queryKeys.admin.branchAnalyticsBranches(),
    queryFn: adminService.getBranchAnalyticsBranches,
    staleTime: 5 * 60_000,
  })
  const roster = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data])
  const activeRoster = useMemo(
    () => roster.filter((b) => b.isActive),
    [roster],
  )

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [initialized, setInitialized] = useState(false)
  useEffect(() => {
    if (initialized || branchesQuery.data === undefined) return
    const ids = new Set([...activeRoster.map((b) => b.id), ...lockedBranchIds])
    setSelectedIds(roster.filter((b) => ids.has(b.id)).map((b) => b.id))
    setInitialized(true)
  }, [initialized, branchesQuery.data, activeRoster, roster, lockedBranchIds])

  // Selection stays in roster order so matrix columns match the pill order.
  const applySelection = (ids: Set<string>) =>
    setSelectedIds(roster.filter((b) => ids.has(b.id)).map((b) => b.id))

  const toggleBranch = (branchId: string) => {
    if (lockedBranchIds.includes(branchId)) return
    const ids = new Set(selectedIds)
    if (ids.has(branchId)) ids.delete(branchId)
    else ids.add(branchId)
    applySelection(ids)
  }
  const selectAll = () =>
    applySelection(
      new Set([...activeRoster.map((b) => b.id), ...lockedBranchIds]),
    )
  const clearBranches = () => applySelection(new Set(lockedBranchIds))

  // Branch → colour by roster position, shared by pills/bars/lines/columns.
  const branchColorFor = useMemo(() => {
    const map = new Map(
      roster.map((b, i) => [b.id, CHART_COLORS[i % CHART_COLORS.length]]),
    )
    return (branchId: string) => map.get(branchId) ?? CHART_COLORS[0]
  }, [roster])

  const request = useMemo<IBrandBranchComparisonRequest | null>(
    () =>
      selectedIds.length > 0
        ? { branchIds: selectedIds, startDate, endDate }
        : null,
    [selectedIds, startDate, endDate],
  )
  const comparison = useBrandBranchComparison(request)

  const [metric, setMetric] = useState<BrandBranchMetric>('revenue')
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport(format: ExportFormat) {
    if (!comparison.data) return
    setIsExporting(true)
    try {
      const payload = buildBrandBranchExport(comparison.data)
      await exportData(format, payload.rows, payload.columns, payload.meta)
      toast.success(
        format === 'pdf' ? 'PDF download started' : 'Excel download started',
      )
    } catch {
      toast.error('Failed to export comparison.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <BrandBranchPicker
        branches={roster}
        selectedIds={selectedIds}
        lockedBranchIds={lockedBranchIds}
        isRefreshing={comparison.isFetching}
        colorFor={branchColorFor}
        onToggle={toggleBranch}
        onSelectAll={selectAll}
        onClear={clearBranches}
      />

      {selectedIds.length === 0 ? (
        <Card className="p-4">
          <EmptyState
            title="Select branches to compare"
            description="Pick one or more branches — the comparison refreshes automatically."
          />
        </Card>
      ) : selectedBrandId ? (
        <BrandBranchDrilldown
          brandId={selectedBrandId}
          branchIds={selectedIds}
          startDate={startDate}
          endDate={endDate}
          branchColorFor={branchColorFor}
          onBack={() => setSelectedBrandId(null)}
        />
      ) : (
        <BrandBranchLeaderboard
          data={comparison.data}
          isLoading={comparison.isLoading}
          metric={metric}
          onMetricChange={setMetric}
          branchColorFor={branchColorFor}
          onSelectBrand={setSelectedBrandId}
          onExport={handleExport}
          isExporting={isExporting}
        />
      )}
    </div>
  )
}
