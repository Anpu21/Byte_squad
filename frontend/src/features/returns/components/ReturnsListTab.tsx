import { Link } from 'react-router-dom';
import { LuPlus as Plus } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useReturnsListPage } from '../hooks/useReturnsListPage';
import { ReturnsTable } from './ReturnsTable';
import { ReturnsFilters } from './ReturnsFilters';

export function ReturnsListTab() {
    const p = useReturnsListPage();
    // Cashiers process returns through the POS modal, not this back-office form.
    const canCreate = !p.isCashier;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <ReturnsFilters
                    searchInput={p.searchInput}
                    setSearch={p.setSearch}
                    startDate={p.startDate}
                    setStartDate={p.setStartDate}
                    endDate={p.endDate}
                    setEndDate={p.setEndDate}
                    isAdmin={p.isAdmin}
                    branches={p.branches}
                    branchId={p.branchId}
                    setBranchId={p.setBranchId}
                />
                {canCreate && (
                    <Link to={FRONTEND_ROUTES.RETURN_NEW} className="shrink-0">
                        <Button>
                            <Plus size={15} />
                            New return
                        </Button>
                    </Link>
                )}
            </div>

            {p.isError && (
                <div className="px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    Could not load returns. Please try again.
                </div>
            )}

            <Card className="overflow-hidden">
                <ReturnsTable
                    rows={p.rows}
                    isLoading={p.isLoading}
                    showCashier={!p.isCashier}
                />
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
    );
}
