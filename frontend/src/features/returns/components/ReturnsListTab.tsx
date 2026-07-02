import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useReturnsListPage } from '../hooks/useReturnsListPage';
import { ReturnsTable } from './ReturnsTable';
import { ReturnsFilters } from './ReturnsFilters';

/**
 * Returns hub — List tab. View-only: cashiers create returns/exchanges through
 * the POS modal, and admins/managers review here (no back-office create form).
 */
export function ReturnsListTab() {
    const p = useReturnsListPage();

    return (
        <div className="space-y-4">
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
