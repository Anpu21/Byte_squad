import { useTransferRequestsPage } from '@/features/transfer-requests/hooks/useTransferRequestsPage';
import { TransferScopeTabs } from '@/features/transfer-requests/components/TransferScopeTabs';
import { TransferRequestsTable } from '@/features/transfer-requests/components/TransferRequestsTable';
import { useStockTransferRealtime } from '@/hooks/useStockTransferRealtime';

export function TransferRequestsPage() {
    useStockTransferRealtime();
    const p = useTransferRequestsPage();

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Stock Transfers
                    </h1>
                    <p className="text-sm text-text-3 mt-1">
                        Request inventory from other branches and fulfill
                        approved incoming transfers.
                    </p>
                </div>
                <button
                    onClick={p.goNew}
                    className="h-9 px-4 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all flex items-center gap-2 self-start"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Request
                </button>
            </div>

            <TransferScopeTabs
                active={p.tab}
                onChange={p.setTab}
                myCount={p.myCount}
                incomingCount={p.incomingCount}
            />

            <TransferRequestsTable
                tab={p.tab}
                items={p.items}
                isLoading={p.isLoading}
                shippingId={p.shippingId}
                onShip={p.handleShip}
                onRowClick={p.goDetail}
            />
        </div>
    );
}
