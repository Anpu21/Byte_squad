import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '@/components/ui/PageHeader'
import { adminService } from '@/services/admin.service'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/constants/enums'
import { cn } from '@/lib/utils'
import { BrandFilters } from './components/BrandFilters'
import { BrandOverview } from './components/BrandOverview'
import { BrandDrilldown } from './components/BrandDrilldown'
import { BrandManageTab } from './components/BrandManageTab'
import { CategoryBrandComparison } from './components/CategoryBrandComparison'
import { daysAgoIso, todayIso } from './lib/date-range'

type BrandTab = 'analyze' | 'by-category' | 'manage'

const TABS: { id: BrandTab; label: string }[] = [
  { id: 'analyze', label: 'Brands' },
  { id: 'by-category', label: 'By category' },
  { id: 'manage', label: 'Manage' },
]

export function BrandAnalyticsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === UserRole.ADMIN
  const [tab, setTab] = useState<BrandTab>('analyze')
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
        subtitle={
          tab === 'manage'
            ? 'Create, edit, archive, and delete brands'
            : `${scopeLabel} · ${startDate} → ${endDate}`
        }
      />

      <nav className="mb-4 flex gap-1 border-b border-border" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold transition-colors',
              tab === t.id
                ? 'border-primary text-text-1'
                : 'border-transparent text-text-3 hover:text-text-1',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

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
            onStartDate={setStartDate}
            onEndDate={setEndDate}
            onBranchId={setBranchId}
          />
          {tab === 'analyze' ? (
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
          ) : (
            <CategoryBrandComparison params={params} />
          )}
        </div>
      )}
    </div>
  )
}
