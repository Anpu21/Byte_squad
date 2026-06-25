import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import BarChart from '@/components/charts/BarChart'
import ExportMenu from '@/components/common/ExportMenu'
import { DataTable, type DataTableColumn } from '@/components/ui'
import { Select } from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { adminService } from '@/services/admin.service'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/hooks/useAuth'
import { useTransferAnalyticsQuery } from '../hooks/useTransferAnalyticsQuery'
import { exportTransferHistory } from '../lib/export-transfers'
import type { ExportFormat } from '@/lib/exportUtils'
import type { ITransferAnalyticsResponse } from '@/types'

type TopProduct = ITransferAnalyticsResponse['topProducts'][number]

const TOP_PRODUCT_COLUMNS: DataTableColumn<TopProduct>[] = [
  {
    key: 'productName',
    header: 'Top products',
    className: 'font-medium text-text-1',
    render: (p) => p.productName,
  },
  {
    key: 'transfers',
    header: 'Transfers',
    align: 'right',
    numeric: true,
    render: (p) => p.transfers,
  },
  {
    key: 'units',
    header: 'Units',
    align: 'right',
    numeric: true,
    render: (p) => p.units,
  },
]

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'text-warning' },
  approved: { label: 'Approved', cls: 'text-info' },
  in_transit: { label: 'In transit', cls: 'text-primary' },
  completed: { label: 'Completed', cls: 'text-accent' },
  rejected: { label: 'Rejected', cls: 'text-text-3' },
  cancelled: { label: 'Cancelled', cls: 'text-text-3' },
}

interface TransferReportProps {
  isAdmin: boolean
}

export function TransferReport({ isAdmin }: TransferReportProps) {
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
      from: startDate,
      to: endDate,
      branchId: isAdmin && branchId ? branchId : undefined,
    }),
    [startDate, endDate, branchId, isAdmin],
  )

  const { data, isLoading } = useTransferAnalyticsQuery(params)
  const kpis = data?.kpis
  const chartData = (data?.series ?? []).map((s) => ({
    name: s.day.slice(5),
    value: s.count,
  }))
  const top = data?.topProducts ?? []

  const scopeLabel = isAdmin
    ? branchId
      ? (branchesQuery.data?.find((b) => b.id === branchId)?.name ??
        'Selected branch')
      : 'All branches'
    : 'My branch'
  const rangeLabel = `${startDate} → ${endDate}`
  const hasData = (kpis?.total ?? 0) > 0

  const handleExport = async (format: ExportFormat) => {
    if (!hasData) return
    try {
      setIsExporting(true)
      await exportTransferHistory({
        params,
        scopeLabel,
        rangeLabel,
        user: user
          ? { firstName: user.firstName, lastName: user.lastName }
          : null,
        format,
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
            disabled={!hasData}
            isPreparing={isExporting}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Transfers" value={String(kpis?.total ?? 0)} />
        <Kpi label="Completed" value={String(kpis?.completed ?? 0)} />
        <Kpi label="In transit" value={String(kpis?.inTransit ?? 0)} />
        <Kpi label="Pending" value={String(kpis?.pending ?? 0)} />
        <Kpi
          label="Avg approval"
          value={kpis?.avgApprovalHours != null ? `${kpis.avgApprovalHours}h` : '—'}
        />
        <Kpi
          label="Avg fulfilment"
          value={
            kpis?.avgFulfilmentHours != null ? `${kpis.avgFulfilmentHours}h` : '—'
          }
        />
      </div>

      <div className="border border-border rounded-xl p-4 bg-surface">
        <h3 className="text-sm font-semibold text-text-1 mb-3">
          Transfer volume
        </h3>
        {isLoading ? (
          <p className="text-sm text-text-3 py-8 text-center">Loading…</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-text-3 py-8 text-center">
            No transfers in this range.
          </p>
        ) : (
          <BarChart data={chartData} height={240} />
        )}
      </div>

      {(data?.byStatus.length ?? 0) > 0 && (
        <div className="border border-border rounded-xl p-4 bg-surface flex flex-wrap gap-x-6 gap-y-2">
          {data?.byStatus.map((s) => {
            const meta = STATUS_META[s.status] ?? {
              label: s.status,
              cls: 'text-text-2',
            }
            return (
              <div key={s.status} className="flex items-baseline gap-1.5">
                <span className={`text-lg font-bold ${meta.cls}`}>
                  {s.count}
                </span>
                <span className="text-xs text-text-3">{meta.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {top.length > 0 && (
        <DataTable
          columns={TOP_PRODUCT_COLUMNS}
          rows={top}
          getRowKey={(p) => p.productId}
          zebra
        />
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
