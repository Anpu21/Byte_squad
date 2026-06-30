import {
  LuCoins as Coins,
  LuReceipt as Receipt,
  LuCalculator as Calculator,
  LuUsers as Users,
} from 'react-icons/lu'
import BarChart from '@/components/charts/BarChart'
import AreaChart from '@/components/charts/AreaChart'
import DonutChart from '@/components/charts/DonutChart'
import { DataTable, EmptyState, KpiCard, FIELD_SHELL, FIELD_BORDER } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { useGroupAnalyticsPage } from '@/features/customer-groups/hooks/useGroupAnalyticsPage'
import {
  toMemberSlices,
  toProductBars,
  toTrendSeries,
} from '@/features/customer-groups/lib/group-analytics-charts'
import {
  memberColumns,
  productColumns,
} from '@/features/customer-groups/components/group-analytics-columns'
import type { IGroupMemberSpendRow, IGroupProductSpendRow } from '@/types'

const dateInputClass = `${FIELD_SHELL} ${FIELD_BORDER} h-10 px-3`

function ChartMessage({ children }: { children: string }) {
  return <p className="py-10 text-center text-sm text-text-3">{children}</p>
}

/**
 * Group analytics body — KPIs, spend charts, and member/product tables for a
 * date range. Rendered inside the group detail page's Analytics tab; reads the
 * group id from the route via `useGroupAnalyticsPage`.
 */
export function GroupAnalyticsPanel() {
  const p = useGroupAnalyticsPage()
  const data = p.data

  const memberSlices = toMemberSlices(data?.byMember ?? [])
  const productBars = toProductBars(data?.byProduct ?? [])
  const trend = toTrendSeries(data?.trend ?? [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-text-2">
          What your group buys together, and who&apos;s spending.
        </p>
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-text-2">
            From
            <input
              type="date"
              value={p.startDate}
              max={p.endDate}
              onChange={(e) => p.setStartDate(e.target.value)}
              className={`${dateInputClass}${(p.startDate) ? '' : ' date-empty'}`}
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
              className={`${dateInputClass}${(p.endDate) ? '' : ' date-empty'}`}
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
