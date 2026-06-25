import { useStockTransferRealtime } from '@/hooks/useStockTransferRealtime';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { TransferBoard } from '@/features/admin-transfer-board/components/TransferBoard';
import { TransferBoardHeader } from '@/features/admin-transfer-board/components/TransferBoardHeader';
import { useTransferBoardData } from '@/features/admin-transfer-board/hooks/useTransferBoardData';
import {
    useAdminTransfersTab,
    type AdminTransfersTab,
} from '@/features/admin-transfer-board/hooks/useAdminTransfersTab';
import { TransferHistoryView } from '@/features/transfer-history/components/TransferHistoryView';
import { TransferReport } from '@/features/transfer-report/components/TransferReport';

export function AdminTransfersPage() {
    useStockTransferRealtime();
    const { tab, setTab } = useAdminTransfersTab();
    const board = useTransferBoardData();

    const tabs: TabItem<AdminTransfersTab>[] = [
        { key: 'board', label: 'Pipeline', badge: board.total },
        { key: 'history', label: 'History' },
        { key: 'report', label: 'Report' },
    ];

    return (
        <div className="animate-in fade-in duration-300">
            {tab === 'board' ? (
                <TransferBoardHeader total={board.total} />
            ) : null}

            <Tabs
                tabs={tabs}
                active={tab}
                onChange={setTab}
                ariaLabel="Stock transfer views"
            />

            {tab === 'board' && <TransferBoard />}
            {tab === 'history' && <TransferHistoryView />}
            {tab === 'report' && <TransferReport isAdmin />}
        </div>
    );
}
