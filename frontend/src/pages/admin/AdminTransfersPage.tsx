import { useAdminTransfersPage } from '@/features/admin-transfers/hooks/useAdminTransfersPage';
import { TransferFilterTabs } from '@/features/admin-transfers/components/TransferFilterTabs';
import { AdminTransfersTable } from '@/features/admin-transfers/components/AdminTransfersTable';
import { TransfersPagination } from '@/features/admin-transfers/components/TransfersPagination';

export function AdminTransfersPage() {
    const p = useAdminTransfersPage();
    const showPagination =
        !p.isLoading && p.items.length > 0 && p.totalPages > 1;

    return (
        <div className="animate-in fade-in duration-300">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Stock Transfers
                </h1>
                <p className="text-sm text-text-3 mt-1">
                    Review and approve inter-branch transfer requests.
                </p>
            </div>

            <TransferFilterTabs
                active={p.filter}
                counts={p.counts}
                onChange={p.changeFilter}
            />

            <div className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden">
                <AdminTransfersTable items={p.items} isLoading={p.isLoading} />

                {showPagination && (
                    <TransfersPagination
                        page={p.page}
                        totalPages={p.totalPages}
                        onChange={p.setPage}
                    />
                )}
            </div>
        </div>
    );
}
