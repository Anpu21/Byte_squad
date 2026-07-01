import { useTransferHistoryPage } from '../hooks/useTransferHistoryPage';
import { TransferHistoryHeader } from './TransferHistoryHeader';
import { TransferHistoryFilters } from './TransferHistoryFilters';
import { TransferHistoryTable } from './TransferHistoryTable';

interface TransferHistoryViewProps {
    showHeader?: boolean;
}

export function TransferHistoryView({ showHeader = true }: TransferHistoryViewProps) {
    const p = useTransferHistoryPage();
    const f = p.filters;
    const th = f.transferHistory;

    return (
        <div className="animate-in fade-in duration-300">
            {showHeader && (
                <TransferHistoryHeader
                    isAdmin={p.isAdmin}
                    total={th.total}
                    hasActiveFilters={f.hasActiveFilters}
                    onClearFilters={f.clearFilters}
                />
            )}

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
                total={th.total}
                pageSize={th.limit}
                onPageChange={th.setPage}
            />
        </div>
    );
}
