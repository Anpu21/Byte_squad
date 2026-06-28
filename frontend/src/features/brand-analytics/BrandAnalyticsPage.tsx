import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '@/components/ui/PageHeader'
import { adminService } from '@/services/admin.service'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/constants/enums'
import { BrandFilters } from './components/BrandFilters'
import { BrandOverview } from './components/BrandOverview'
import { BrandDrilldown } from './components/BrandDrilldown'
import { daysAgoIso, todayIso } from './lib/date-range'

export function BrandAnalyticsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === UserRole.ADMIN
  const [startDate, setStartDate] = useState(() => daysAgoIso(30))
  const [endDate, setEndDate] = useState(() => todayIso())
  const [branchId, setBranchId] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)

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

  const scopeLabel = isAdmin
    ? branchId
      ? (branchesQuery.data?.find((b) => b.id === branchId)?.name ??
        'Selected branch')
      : 'All branches'
    : 'My branch'

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        eyebrow="Inventory"
        title="Brand analysis"
        subtitle={`${scopeLabel} · ${startDate} → ${endDate}`}
      />
      <div className="space-y-4">
        <BrandFilters
          startDate={startDate}
          endDate={endDate}
          branchId={branchId}
          isAdmin={Boolean(isAdmin)}
          branches={branchesQuery.data ?? []}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
          onBranchId={setBranchId}
        />
        {selectedBrandId ? (
          <BrandDrilldown
            brandId={selectedBrandId}
            params={params}
            onBack={() => setSelectedBrandId(null)}
          />
        ) : (
          <BrandOverview params={params} onSelectBrand={setSelectedBrandId} />
        )}
      </div>
    </div>
  )
}
