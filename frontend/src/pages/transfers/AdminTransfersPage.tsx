import { useStockTransferRealtime } from '@/hooks/useStockTransferRealtime';
import { TransferBoard } from '@/features/admin-transfer-board/components/TransferBoard';
import { TransferBoardHeader } from '@/features/admin-transfer-board/components/TransferBoardHeader';
import { useTransferBoardData } from '@/features/admin-transfer-board/hooks/useTransferBoardData';
import { AdminTransfersTabs } from '@/features/admin-transfers/components/AdminTransfersTabs';
import { useAdminTransfersTab } from '@/features/admin-transfers/hooks/useAdminTransfersTab';
import { TransferHistoryView } from '@/features/transfer-history/components/TransferHistoryView';

export function AdminTransfersPage() {
    useStockTransferRealtime();
    const { tab, setTab } = useAdminTransfersTab();
    const board = useTransferBoardData();

    return (
        <div className="animate-in fade-in duration-300">
            {tab === 'board' ? (
                <TransferBoardHeader total={board.total} />
            ) : null}

            <AdminTransfersTabs
                active={tab}
                onChange={setTab}
                boardCount={board.total}
            />

            {tab === 'board' ? <TransferBoard /> : <TransferHistoryView />}
        </div>
    );
}
