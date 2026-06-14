import { stockTransfersService } from '@/services/stock-transfers.service'
import { TransferStatus } from '@/constants/enums'
import {
  exportData,
  type ExportColumn,
  type ExportFormat,
} from '@/lib/exportUtils'

interface TransferExportRow {
  date: string
  product: string
  route: string
  requested: number
  approved: number
  status: string
  requestedBy: string
}

interface ExportArgs {
  params: { from?: string; to?: string; branchId?: string }
  scopeLabel: string
  rangeLabel: string
  user: { firstName: string; lastName: string } | null
  format: ExportFormat
}

/**
 * Fetch the full transfer list for the window (all statuses) and export it as
 * PDF/Excel via the shared exporter. The history endpoint has no max-limit cap,
 * so a single bulk fetch is safe.
 */
export async function exportTransferHistory({
  params,
  scopeLabel,
  rangeLabel,
  user,
  format,
}: ExportArgs): Promise<void> {
  const result = await stockTransfersService.getHistory({
    status: Object.values(TransferStatus),
    from: params.from,
    to: params.to,
    branchId: params.branchId,
    page: 1,
    limit: 10000,
  })

  const rows: TransferExportRow[] = (result.items ?? []).map((t) => ({
    date: t.createdAt,
    product: t.product?.name ?? '',
    route: `${t.sourceBranch?.name ?? '—'}  →  ${t.destinationBranch?.name ?? ''}`,
    requested: t.requestedQuantity,
    approved: t.approvedQuantity ?? 0,
    status: t.status,
    requestedBy: t.requestedBy
      ? `${t.requestedBy.firstName} ${t.requestedBy.lastName}`
      : '',
  }))

  const columns: ExportColumn<TransferExportRow>[] = [
    { header: 'Date', key: 'date', format: 'date' },
    { header: 'Product', key: 'product' },
    { header: 'Source → Destination', key: 'route' },
    { header: 'Requested', key: 'requested', align: 'right' },
    { header: 'Approved', key: 'approved', align: 'right' },
    { header: 'Status', key: 'status' },
    { header: 'Requested by', key: 'requestedBy' },
  ]

  await exportData(format, rows, columns, {
    title: 'Stock Transfer Report',
    subtitle: `${scopeLabel}  ·  ${rangeLabel}`,
    filenameBase: 'stock-transfers',
    companyName: 'LedgerPro',
    generatedBy: user ? `${user.firstName} ${user.lastName}` : undefined,
    summary: [{ label: 'Transfers', value: String(rows.length) }],
  })
}
