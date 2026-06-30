/** One KPI tile in the transfer report's summary grid. */
export function TransferReportKpi({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border border-border rounded-xl p-3 bg-surface">
      <p className="text-[11px] uppercase tracking-wide text-text-3 font-semibold">
        {label}
      </p>
      <p className="text-lg font-bold text-text-1 mt-0.5">{value}</p>
    </div>
  )
}
