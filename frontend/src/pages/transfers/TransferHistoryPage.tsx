import { useTransferHistoryPage } from '@/features/transfer-history/hooks/useTransferHistoryPage';
import { TransferHistoryHeader } from '@/features/transfer-history/components/TransferHistoryHeader';
import { TransferHistoryFilters } from '@/features/transfer-history/components/TransferHistoryFilters';
import { TransferHistoryTable } from '@/features/transfer-history/components/TransferHistoryTable';

export function TransferHistoryPage() {
    const p = useTransferHistoryPage();
    const f = p.filters;
    const th = f.transferHistory;

    return (
        <div className="animate-in fade-in duration-300">
            <TransferHistoryHeader
                isAdmin={p.isAdmin}
                total={th.total}
                hasActiveFilters={f.hasActiveFilters}
                onClearFilters={f.clearFilters}
            />

            <TransferHistoryFilters
                isAdmin={p.isAdmin}
                filters={{
                    selectedStatuses: f.selectedStatuses,
                    from: f.from,
                    to: f.to,
                    selectedProduct: p.selectedProduct,
                    branchId: f.branchId,
                }}
                actions={{
                    toggleStatus: f.toggleStatus,
                    setFrom: f.setFrom,
                    setTo: f.setTo,
                    selectProduct: f.setProductId,
                    clearProduct: () => f.setProductId(''),
                    setBranchId: f.setBranchId,
                }}
                products={p.products}
                branches={p.branches}
            />

            <TransferHistoryTable
                items={th.items}
                isLoading={th.isLoading}
                hasActiveFilters={f.hasActiveFilters}
                onClearFilters={f.clearFilters}
                page={th.page}
                totalPages={th.totalPages}
                onPageChange={th.setPage}
            />
        </div>
    );
}
