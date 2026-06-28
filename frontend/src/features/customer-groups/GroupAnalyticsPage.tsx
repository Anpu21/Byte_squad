import { Link } from 'react-router-dom'
import {
  LuArrowLeft as ArrowLeft,
  LuCoins as Coins,
  LuReceipt as Receipt,
  LuCalculator as Calculator,
  LuUsers as Users,
} from 'react-icons/lu'
import BarChart from '@/components/charts/BarChart'
import AreaChart from '@/components/charts/AreaChart'
import DonutChart from '@/components/charts/DonutChart'
import {
  DataTable,
  EmptyState,
  KpiCard,
  type DataTableColumn,
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { useGroupAnalyticsPage } from '@/features/customer-groups/hooks/useGroupAnalyticsPage'
import {
  toMemberSlices,
  toProductBars,
  toTrendSeries,
} from '@/features/customer-groups/lib/group-analytics-charts'
import type { IGroupMemberSpendRow, IGroupProductSpendRow } from '@/types'

const dateInputClass =
  'h-10 rounded-md border border-border-strong bg-surface px-3 text-[13px] text-text-1 outline-none transition-colors focus:border-focus focus:ring-[3px] focus:ring-focus/25'

function ChartMessage({ children }: { children: string }) {
  return <p className="py-10 text-center text-sm text-text-3">{children}</p>
}

export function GroupAnalyticsPage() {
  const p = useGroupAnalyticsPage()
  const data = p.data

  const memberSlices = toMemberSlices(data?.byMember ?? [])
  const productBars = toProductBars(data?.byProduct ?? [])
  const trend = toTrendSeries(data?.trend ?? [])

  const memberColumns: DataTableColumn<IGroupMemberSpendRow>[] = [
    {
      key: 'member',
      header: 'Member',
      className: 'font-medium text-text-1',
      render: (r) => r.name,
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'right',
      numeric: true,
      render: (r) => r.orders,
    },
    {
      key: 'spend',
      header: 'Spent',
      align: 'right',
      numeric: true,
      render: (r) => formatCurrency(r.spend),
    },
    {
      key: 'share',
      header: 'Share',
      align: 'right',
      numeric: true,
      render: (r) => `${r.sharePct}%`,
    },
  ]

  const productColumns: DataTableColumn<IGroupProductSpendRow>[] = [
    {
      key: 'product',
      header: 'Product',
      className: 'font-medium text-text-1',
      render: (r) => r.productName,
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
      header: 'Spent',
      align: 'right',
      numeric: true,
      render: (r) => formatCurrency(r.revenue),
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
    <div className="mx-auto max-w-5xl">
      <Link
        to={p.detailPath}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-2 transition-colors hover:text-text-1"
      >
        <ArrowLeft size={16} /> {p.group?.name ?? 'Group'}
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-1 sm:text-3xl">
            Group analytics
          </h1>
          <p className="mt-1.5 text-sm text-text-2">
            What your group buys together, and who&apos;s spending.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-text-2">
            From
            <input
              type="date"
              value={p.startDate}
              max={p.endDate}
              onChange={(e) => p.setStartDate(e.target.value)}
              className={dateInputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-text-2">
            To
            <input
              type="date"
              value={p.endDate}
              min={p.startDate}
              max={p.maxDate}
              onChange={(e) => p.setEndDate(e.target.value)}
              className={dateInputClass}
            />
          </label>
        </div>
      </div>

      {p.isError ? (
        <EmptyState
          title="Analytics unavailable"
          description="This group doesn't exist, or you're not a member."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Total spent"
              accent="accent"
              icon={<Coins className="h-4 w-4" />}
              value={formatCurrency(data?.totalSpend ?? 0)}
            />
            <KpiCard
              label="Orders"
              accent="primary"
              icon={<Receipt className="h-4 w-4" />}
              value={String(data?.orderCount ?? 0)}
            />
            <KpiCard
              label="Avg order"
              accent="info"
              icon={<Calculator className="h-4 w-4" />}
              value={formatCurrency(data?.avgOrderValue ?? 0)}
            />
            <KpiCard
              label="Members"
              accent="warning"
              icon={<Users className="h-4 w-4" />}
              value={String(data?.memberCount ?? 0)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold text-text-1">
                Spend by member
              </h3>
              {p.isLoading ? (
                <ChartMessage>Loading…</ChartMessage>
              ) : (
                <DonutChart
                  data={memberSlices}
                  formatValue={(v) => formatCurrency(v)}
                  emptyLabel="No spend in this range"
                />
              )}
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold text-text-1">
                Spend over time
              </h3>
              {p.isLoading ? (
                <ChartMessage>Loading…</ChartMessage>
              ) : trend.length === 0 ? (
                <ChartMessage>No spend in this range.</ChartMessage>
              ) : (
                <AreaChart
                  data={trend}
                  height={240}
                  formatValue={(v) => formatCurrency(v)}
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-1">
              Top products by spend
            </h3>
            {p.isLoading ? (
              <ChartMessage>Loading…</ChartMessage>
            ) : productBars.length === 0 ? (
              <ChartMessage>No products bought in this range.</ChartMessage>
            ) : (
              <BarChart
                data={productBars}
                height={260}
                formatValue={(v) => formatCurrency(v)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DataTable<IGroupMemberSpendRow>
              columns={memberColumns}
              rows={data?.byMember ?? []}
              getRowKey={(r) => r.userId}
              isLoading={p.isLoading}
              zebra
              empty={
                <EmptyState
                  title="No member spend yet"
                  description="Spend shows up here once the group buys something."
                />
              }
            />
            <DataTable<IGroupProductSpendRow>
              columns={productColumns}
              rows={data?.byProduct ?? []}
              getRowKey={(r) => r.productId}
              isLoading={p.isLoading}
              zebra
              empty={
                <EmptyState
                  title="No products yet"
                  description="Products the group buys will be ranked here."
                />
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
