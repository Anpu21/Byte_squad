import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import { FRONTEND_ROUTES } from '@/constants/routes'
import { useReturnsListPage } from '@/features/returns/hooks/useReturnsListPage'
import { ReturnsTable } from '@/features/returns/components/ReturnsTable'

export function ReturnsPage() {
  const p = useReturnsListPage()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Returns"
        subtitle={`${p.total} return(s)`}
        actions={
          <Link to={FRONTEND_ROUTES.RETURN_NEW}>
            <Button>
              <Plus size={15} />
              New return
            </Button>
          </Link>
        }
      />

      {p.isError && (
        <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
          Could not load returns. Please try again.
        </div>
      )}

      <Card className="overflow-hidden">
        <ReturnsTable rows={p.rows} isLoading={p.isLoading} />
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
