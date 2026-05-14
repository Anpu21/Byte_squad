import { useStockTransferRealtime } from '@/hooks/useStockTransferRealtime';
import { TransferBoard } from '@/features/admin-transfer-board/components/TransferBoard';
import { TransferBoardHeader } from '@/features/admin-transfer-board/components/TransferBoardHeader';
import { useTransferBoardData } from '@/features/admin-transfer-board/hooks/useTransferBoardData';

export function AdminTransfersPage() {
    useStockTransferRealtime();
    const data = useTransferBoardData();

    return (
        <div className="animate-in fade-in duration-300">
            <TransferBoardHeader total={data.total} />
            <TransferBoard />
        </div>
    );
}
