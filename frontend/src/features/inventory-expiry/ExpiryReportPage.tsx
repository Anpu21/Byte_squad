import { LuPackagePlus as PackagePlus, LuBellRing as BellRing } from 'react-icons/lu';
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import Segmented from '@/components/ui/Segmented'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/constants/enums'
import Pagination from '@/components/ui/Pagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { useExpiryReportPage } from '@/features/inventory-expiry/hooks/useExpiryReportPage'
import { ExpiryTable } from '@/features/inventory-expiry/components/ExpiryTable'
import { ReceiveBatchModal } from '@/features/inventory-expiry/components/ReceiveBatchModal'

const WINDOW_OPTIONS = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
]

export function ExpiryReportPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === UserRole.ADMIN
  const p = useExpiryReportPage()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        subtitle={`${p.total} batch(es) expiring within ${p.withinDays} days`}
        actions={
          <>
            <Segmented
              value={String(p.withinDays)}
              options={WINDOW_OPTIONS}
              onChange={(v) => p.setWithinDays(Number(v))}
            />
            {isAdmin && (
              <Button
                variant="secondary"
                onClick={p.runScan}
                disabled={p.isScanning}
              >
                <BellRing size={15} />
                {p.isScanning ? 'Scanning…' : 'Run alert scan'}
              </Button>
            )}
            <Button onClick={p.openReceive}>
              <PackagePlus size={15} />
              Receive batch
            </Button>
          </>
        }
      />

      {p.isError && (
        <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
          Could not load the expiry report. Please try again.
        </div>
      )}

      <Card className="overflow-hidden">
        <ExpiryTable rows={p.rows} isLoading={p.isLoading} />
        {!p.isLoading && p.rows.length > 0 && (
          <Pagination
            page={p.page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={p.total}
            onPageChange={p.setPage}
            unit="batches"
          />
        )}
      </Card>

      <ReceiveBatchModal
        isOpen={p.isReceiveOpen}
        onClose={p.closeReceive}
        onSubmit={p.submitBatch}
        isSubmitting={p.isCreating}
        role={user?.role}
      />
    </div>
  )
}
