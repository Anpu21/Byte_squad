import BarChart from '@/components/charts/BarChart'
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { ICategorySalesRow } from '@/types'

interface CategoryAnalyticsData {
  totalRevenue?: number
  totalUnits?: number
  totalTransactions?: number
}

interface CategoryAnalyticsResultsProps {
  data: CategoryAnalyticsData | undefined
  rows: ICategorySalesRow[]
  isLoading: boolean
  columns: DataTableColumn<ICategorySalesRow>[]
}

/** KPIs, revenue-by-category bar chart, and the category-sales table. */
export function CategoryAnalyticsResults({
  data,
  rows,
  isLoading,
  columns,
}: CategoryAnalyticsResultsProps) {
  const chartData = rows.map((r) => ({ name: r.categoryName, value: r.revenue }))

  return (
    <>
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
        <DataTable<ICategorySalesRow>
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.categoryId}
          isLoading={isLoading}
          zebra
          empty={
            <EmptyState
              title="No sales in this range"
              description="Adjust the date range or branch filter to see category sales."
            />
          }
        />
      )}
    </>
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
