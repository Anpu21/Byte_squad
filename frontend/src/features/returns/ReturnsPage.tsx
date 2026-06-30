import { Link } from 'react-router-dom'
import { LuPlus as Plus } from 'react-icons/lu';
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import { FRONTEND_ROUTES } from '@/constants/routes'
import Pagination from '@/components/ui/Pagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { useReturnsListPage } from '@/features/returns/hooks/useReturnsListPage'
import { ReturnsTable } from '@/features/returns/components/ReturnsTable'

export function ReturnsPage() {
  const p = useReturnsListPage()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
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
        {!p.isLoading && p.rows.length > 0 && (
          <Pagination
            page={p.page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={p.total}
            onPageChange={p.setPage}
            unit="returns"
          />
        )}
      </Card>
    </div>
  )
}
