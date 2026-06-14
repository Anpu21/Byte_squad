import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import BarChart from '@/components/charts/BarChart'
import ExportMenu from '@/components/common/ExportMenu'
import { Select } from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { adminService } from '@/services/admin.service'
import { queryKeys } from '@/lib/queryKeys'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useCategoryAnalyticsQuery } from '../hooks/useCategoryAnalyticsQuery'
import { exportCategoryAnalytics } from '../lib/export-category-analytics'
import type { ExportFormat } from '@/lib/exportUtils'

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
  const chartData = rows.map((r) => ({ name: r.categoryName, value: r.revenue }))

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Revenue" value={formatCurrency(data?.totalRevenue ?? 0)} />
        <Kpi label="Units" value={String(Math.round(data?.totalUnits ?? 0))} />
        <Kpi
          label="Transactions"
          value={String(data?.totalTransactions ?? 0)}
        />
        <Kpi label="Categories" value={String(rows.length)} />
      </div>

      <div className="border border-border rounded-xl p-4 bg-surface">
        <h3 className="text-sm font-semibold text-text-1 mb-3">
          Revenue by category
        </h3>
        {isLoading ? (
          <p className="text-sm text-text-3 py-8 text-center">Loading…</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-text-3 py-8 text-center">
            No sales in this range.
          </p>
        ) : (
          <BarChart
            data={chartData}
            height={260}
            formatValue={(v) => formatCurrency(v)}
          />
        )}
      </div>

      {rows.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-text-3 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-4 py-2.5">Category</th>
                <th className="text-right font-semibold px-4 py-2.5">Units</th>
                <th className="text-right font-semibold px-4 py-2.5">Revenue</th>
                <th className="text-right font-semibold px-4 py-2.5">Share</th>
                <th className="text-right font-semibold px-4 py-2.5">Txns</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.categoryId} className="border-t border-border">
                  <td className="px-4 py-2.5 font-medium text-text-1">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: r.color ?? 'var(--primary)' }}
                      />
                      {r.categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right mono">
                    {Math.round(r.units)}
                  </td>
                  <td className="px-4 py-2.5 text-right mono">
                    {formatCurrency(r.revenue)}
                  </td>
                  <td className="px-4 py-2.5 text-right mono">{r.sharePct}%</td>
                  <td className="px-4 py-2.5 text-right mono">
                    {r.transactions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded-xl p-3 bg-surface">
      <p className="text-[11px] uppercase tracking-wide text-text-3 font-semibold">
        {label}
      </p>
      <p className="text-lg font-bold text-text-1 mt-0.5">{value}</p>
    </div>
  )
}
