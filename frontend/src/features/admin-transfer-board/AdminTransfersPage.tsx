import { useStockTransferRealtime } from '@/hooks/useStockTransferRealtime';
import { WorkspacePage, type TabItem } from '@/components/ui';
import { TransferBoard } from '@/features/admin-transfer-board/components/TransferBoard';
import { TransferBoardHeader } from '@/features/admin-transfer-board/components/TransferBoardHeader';
import { useTransferBoardData } from '@/features/admin-transfer-board/hooks/useTransferBoardData';
import {
    useAdminTransfersTab,
    type AdminTransfersTab,
} from '@/features/admin-transfer-board/hooks/useAdminTransfersTab';
import { TransferHistoryView } from '@/features/transfer-history/components/TransferHistoryView';
import { TransferReport } from '@/features/transfer-report/components/TransferReport';

interface AdminTransfersPageProps {
    /** Rendered inside the Inventory hub's "transfers" tab → no header/sticky band. */
    embedded?: boolean;
}

export function AdminTransfersPage({
    embedded = false,
}: AdminTransfersPageProps = {}) {
    useStockTransferRealtime();
    const { tab, setTab } = useAdminTransfersTab();
    const board = useTransferBoardData();

    const tabs: TabItem<AdminTransfersTab>[] = [
        { key: 'board', label: 'Pipeline', badge: board.total },
        { key: 'history', label: 'History' },
        { key: 'report', label: 'Report' },
    ];

    return (
        <WorkspacePage
            embedded={embedded}
            eyebrow="Operations"
            title="Stock transfers"
            subtitle="The cross-branch pipeline — requests, shipments, and the full audit trail."
            tabs={tabs}
            active={tab}
            onTabChange={setTab}
            tabsAriaLabel="Stock transfer views"
        >
            {tab === 'board' && <TransferBoardHeader total={board.total} />}
            {tab === 'board' && <TransferBoard />}
            {tab === 'history' && <TransferHistoryView />}
            {tab === 'report' && <TransferReport isAdmin />}
        </WorkspacePage>
    );
}
