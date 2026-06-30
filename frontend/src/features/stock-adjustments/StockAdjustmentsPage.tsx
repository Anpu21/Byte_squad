import { Link } from 'react-router-dom'
import { LuPlus as Plus } from 'react-icons/lu';
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import Segmented from '@/components/ui/Segmented'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/constants/enums'
import { FRONTEND_ROUTES } from '@/constants/routes'
import { useStockAdjustmentsPage } from '@/features/stock-adjustments/hooks/useStockAdjustmentsPage'
import { AdjustmentsTable } from '@/features/stock-adjustments/components/AdjustmentsTable'
import type { IStockAdjustmentStatus } from '@/types'

const STATUS_OPTIONS: { value: IStockAdjustmentStatus | 'all'; label: string }[] =
  [
    { value: 'all', label: 'All' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Reversed', label: 'Reversed' },
  ]

export function StockAdjustmentsPage() {
  const { user } = useAuth()
  const canManage = user?.role === UserRole.ADMIN
  const p = useStockAdjustmentsPage()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        subtitle={`${p.total} adjustment(s)`}
        actions={
          <>
            <Segmented
              value={p.status}
              options={STATUS_OPTIONS}
              onChange={p.setStatus}
            />
            <Link to={FRONTEND_ROUTES.STOCK_ADJUSTMENT_NEW}>
              <Button>
                <Plus size={15} />
                New adjustment
              </Button>
            </Link>
          </>
        }
      />

      {p.isError && (
        <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
          Could not load adjustments. Please try again.
        </div>
      )}

      <Card className="overflow-hidden">
        <AdjustmentsTable
          rows={p.rows}
          isLoading={p.isLoading}
          canManage={canManage}
          isMutating={p.isMutating}
          onApprove={p.onApprove}
          onReverse={p.onReverse}
        />
        {!p.isLoading && p.rows.length > 0 && p.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-text-2">
            <span>
              Page {p.page} of {p.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={p.page <= 1}
                onClick={() => p.setPage(p.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={p.page >= p.totalPages}
                onClick={() => p.setPage(p.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
