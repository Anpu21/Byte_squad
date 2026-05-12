import { useTransferHistoryPage } from '@/features/transfer-history/hooks/useTransferHistoryPage';
import { TransferHistoryHeader } from '@/features/transfer-history/components/TransferHistoryHeader';
import { TransferHistoryFilters } from '@/features/transfer-history/components/TransferHistoryFilters';
import { TransferHistoryTable } from '@/features/transfer-history/components/TransferHistoryTable';

export default function TransferHistoryPage() {
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
                selectedStatuses={f.selectedStatuses}
                onToggleStatus={f.toggleStatus}
                from={f.from}
                setFrom={f.setFrom}
                to={f.to}
                setTo={f.setTo}
                products={p.products}
                selectedProduct={p.selectedProduct}
                onSelectProduct={f.setProductId}
                onClearProduct={() => f.setProductId('')}
                branches={p.branches}
                branchId={f.branchId}
                setBranchId={f.setBranchId}
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
