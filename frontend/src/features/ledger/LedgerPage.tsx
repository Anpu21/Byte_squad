import { useState } from 'react';
import { LuBookPlus as BookPlus } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useLedgerPage } from '@/features/ledger/hooks/useLedgerPage';
import { formatPeriodLabel } from '@/features/ledger/lib/period';
import { LedgerHeader } from '@/features/ledger/components/LedgerHeader';
import { JournalVoucherModal } from '@/features/ledger/components/JournalVoucherModal';
import { LedgerSummaryCards } from '@/features/ledger/components/LedgerSummaryCards';
import { LedgerFilters } from '@/features/ledger/components/LedgerFilters';
import { LedgerTable } from '@/features/ledger/components/LedgerTable';
import Pagination from '@/components/ui/Pagination';

export function LedgerPage() {
    const p = useLedgerPage();
    const { filters } = p;
    const [journalOpen, setJournalOpen] = useState(false);
    const periodLabel = formatPeriodLabel(filters.startDate, filters.endDate);
    const hasFilters =
        Boolean(filters.debouncedSearch) ||
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

            <div className="mb-4 flex justify-end">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setJournalOpen(true)}
                >
                    <BookPlus size={14} aria-hidden />
                    New journal
                </Button>
            </div>

            <LedgerSummaryCards summary={p.summary} />
            <LedgerFilters filters={filters} />

            <Card className="overflow-hidden">
                <LedgerTable
                    entries={p.entriesWithBalance}
                    isLoading={p.isLoading}
                    hasFilters={hasFilters}
                />
                {!p.isLoading && p.entries.length > 0 && (
                    <Pagination
                        page={filters.page}
                        pageSize={p.limit}
                        total={p.total}
                        onPageChange={filters.setPage}
                        unit="entries"
                    />
                )}
            </Card>
            <JournalVoucherModal
                isOpen={journalOpen}
                onClose={() => setJournalOpen(false)}
            />
        </div>
    );
}
