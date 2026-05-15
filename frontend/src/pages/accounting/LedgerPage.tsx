import Card from '@/components/ui/Card';
import { useLedgerPage } from '@/features/ledger/hooks/useLedgerPage';
import { formatPeriodLabel } from '@/features/ledger/lib/period';
import { LedgerHeader } from '@/features/ledger/components/LedgerHeader';
import { LedgerSummaryCards } from '@/features/ledger/components/LedgerSummaryCards';
import { LedgerFilters } from '@/features/ledger/components/LedgerFilters';
import { LedgerTable } from '@/features/ledger/components/LedgerTable';
import { LedgerPagination } from '@/features/ledger/components/LedgerPagination';

export function LedgerPage() {
    const p = useLedgerPage();
    const { filters } = p;
    const periodLabel = formatPeriodLabel(filters.startDate, filters.endDate);
    const hasFilters =
        Boolean(filters.debouncedSearch) ||
        Boolean(filters.branchId) ||
        filters.entryType !== 'all' ||
        Boolean(filters.startDate) ||
        Boolean(filters.endDate);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LedgerHeader
                periodLabel={periodLabel}
                summary={p.summary}
                total={p.total}
                isExporting={p.isExporting}
                onExport={p.handleExport}
            />

            {p.errorMessage && (
                <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    {p.errorMessage}
                </div>
            )}

            <LedgerSummaryCards summary={p.summary} />
            <LedgerFilters filters={filters} branches={p.branches} />

            <Card className="overflow-hidden">
                <LedgerTable
                    entries={p.entriesWithBalance}
                    isLoading={p.isLoading}
                    hasFilters={hasFilters}
                />
                {!p.isLoading && p.entries.length > 0 && (
                    <LedgerPagination
                        page={filters.page}
                        totalPages={p.totalPages}
                        total={p.total}
                        limit={p.limit}
                        onPageChange={filters.setPage}
                    />
                )}
            </Card>
        </div>
    );
}
