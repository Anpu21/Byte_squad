import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspacePage } from '@/components/ui'
import { adminService } from '@/services/admin.service'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/constants/enums'
import { useNavTabs } from '@/config/navigation'
import { BrandFilters } from './components/BrandFilters'
import { BrandOverview } from './components/BrandOverview'
import { BrandDrilldown } from './components/BrandDrilldown'
import { BrandManageTab } from './components/BrandManageTab'
import { CategoryBrandComparison } from './components/CategoryBrandComparison'
import { BrandBranchComparison } from './components/BrandBranchComparison'
import {
  useBrandAnalyticsTab,
  type BrandAnalyticsTab,
} from './hooks/useBrandAnalyticsTab'
import { daysAgoIso, todayIso } from './lib/date-range'

export function BrandAnalyticsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === UserRole.ADMIN
  // Tabs live in the sidebar panel (nav spine), synced via ?tab= like the
  // other hubs — WorkspacePage runs chromeless (no in-page band).
  const tabs = useNavTabs<BrandAnalyticsTab>('brand-analytics')
  const allowedKeys = useMemo(() => tabs.map((t) => t.key), [tabs])
  const { tab, setTab } = useBrandAnalyticsTab(allowedKeys)
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

  const subtitle =
    tab === 'manage'
      ? 'Create, edit, archive, and delete brands'
      : tab === 'by-branch'
        ? `Across branches · ${startDate} → ${endDate}`
        : `${scopeLabel} · ${startDate} → ${endDate}`

  return (
    <WorkspacePage
      eyebrow="Inventory"
      title="Brand analysis"
      subtitle={subtitle}
      tabs={tabs}
      active={tab}
      onTabChange={setTab}
      tabsAriaLabel="Brand analysis views"
      chromeless
    >
      {tab === 'manage' ? (
        <BrandManageTab isAdmin={Boolean(isAdmin)} />
      ) : (
        <div className="space-y-4">
          <BrandFilters
            startDate={startDate}
            endDate={endDate}
            branchId={branchId}
            isAdmin={Boolean(isAdmin)}
            branches={branchesQuery.data ?? []}
            showBranchFilter={tab !== 'by-branch'}
            onStartDate={setStartDate}
            onEndDate={setEndDate}
            onBranchId={setBranchId}
          />
          {tab === 'brands' ? (
            selectedBrandId ? (
              <BrandDrilldown
                brandId={selectedBrandId}
                params={params}
                onBack={() => setSelectedBrandId(null)}
              />
            ) : (
              <BrandOverview
                params={params}
                onSelectBrand={setSelectedBrandId}
              />
            )
          ) : tab === 'by-category' ? (
            <CategoryBrandComparison params={params} />
          ) : (
            <BrandBranchComparison
              startDate={params.startDate}
              endDate={params.endDate}
            />
          )}
        </div>
      )}
    </WorkspacePage>
  )
}
