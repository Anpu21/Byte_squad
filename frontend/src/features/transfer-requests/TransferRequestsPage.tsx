import { LuPlus as Plus } from 'react-icons/lu';
import {
    useTransferRequestsPage,
    TABS,
    type ScopeTab,
} from '@/features/transfer-requests/hooks/useTransferRequestsPage';
import { WorkspacePage, Button, type TabItem } from '@/components/ui';
import { TransferRequestsTable } from '@/features/transfer-requests/components/TransferRequestsTable';
import { TransferHistoryView } from '@/features/transfer-history/components/TransferHistoryView';
import { useStockTransferRealtime } from '@/hooks/useStockTransferRealtime';

interface TransferRequestsPageProps {
    /** Rendered inside the Inventory hub's "transfers" tab → no header/sticky band. */
    embedded?: boolean;
}

export function TransferRequestsPage({
    embedded = false,
}: TransferRequestsPageProps = {}) {
    useStockTransferRealtime();
    const p = useTransferRequestsPage();

    const tabs: TabItem<ScopeTab>[] = TABS.map((t) => ({
        key: t.key,
        label: t.label,
        badge:
            t.key === 'history'
                ? undefined
                : t.key === 'my-requests'
                  ? p.myCount
                  : p.incomingCount,
    }));

    return (
        <WorkspacePage
            embedded={embedded}
            eyebrow="Operations"
            title="Stock transfers"
            subtitle={
                p.tab === 'history'
                    ? 'Past transfers your branch has been involved in — completed, rejected, or cancelled.'
                    : 'Request inventory from other branches and fulfill approved incoming transfers.'
            }
            tabs={tabs}
            active={p.tab}
            onTabChange={p.setTab}
            tabsAriaLabel="Stock transfer views"
        >
            {p.tab === 'history' ? (
                <TransferHistoryView showHeader={false} />
            ) : (
                <>
                    <div className="mb-4 flex justify-end">
                        <Button onClick={p.goNew}>
                            <Plus size={16} aria-hidden />
                            New request
                        </Button>
                    </div>
                    <TransferRequestsTable
                        tab={p.tab}
                        items={p.items}
                        isLoading={p.isLoading}
                        shippingId={p.shippingId}
                        onShip={p.handleShip}
                        receivingId={p.receivingId}
                        onReceive={p.handleReceive}
                        onRowClick={p.goDetail}
                    />
                </>
            )}
        </WorkspacePage>
    );
}
