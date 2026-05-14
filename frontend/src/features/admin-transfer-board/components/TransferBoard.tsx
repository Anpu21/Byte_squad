import { useTransferBoardData } from '../hooks/useTransferBoardData';
import { BOARD_COLUMNS } from '../lib/column-config';
import { TransferBoardColumn } from './TransferBoardColumn';

export function TransferBoard() {
    const data = useTransferBoardData();

    return (
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2">
            {BOARD_COLUMNS.map((column) => (
                <TransferBoardColumn
                    key={column.id}
                    column={column}
                    transfers={data.columns[column.id] ?? []}
                    isLoading={data.isLoading}
                />
            ))}
        </div>
    );
}
