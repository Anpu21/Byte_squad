import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import type { IStockTransferRequest } from '@/types';
import { useTransferBoardData } from '../hooks/useTransferBoardData';
import {
    useBoardActionModal,
    type BoardModalAction,
} from '../hooks/useBoardActionModal';
import { BOARD_COLUMNS } from '../lib/column-config';
import { getDropAction } from '../lib/allowed-transitions';
import { TransferBoardColumn } from './TransferBoardColumn';
import { TransferBoardActionModalHost } from './TransferBoardActionModalHost';

interface DragData {
    transfers: IStockTransferRequest[];
    fromColumnId: string;
}

export function TransferBoard() {
    const data = useTransferBoardData();
    const modal = useBoardActionModal();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const dragData = active.data.current as DragData | undefined;
        if (!dragData || dragData.transfers.length === 0) return;
        const toColumnId = String(over.id);
        const action = getDropAction(dragData.fromColumnId, toColumnId);
        if (!action) {
            if (dragData.fromColumnId !== toColumnId) {
                toast.error(
                    `Cannot move ${dragData.fromColumnId} → ${toColumnId}`,
                );
            }
            return;
        }
        modal.open({
            transfers: dragData.transfers,
            action: action as BoardModalAction,
        });
    };

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2">
                {BOARD_COLUMNS.map((column) => (
                    <TransferBoardColumn
                        key={column.id}
                        column={column}
                        groups={data.columns[column.id] ?? []}
                        isLoading={data.isLoading}
                    />
                ))}
            </div>
            <TransferBoardActionModalHost modal={modal} />
        </DndContext>
    );
}
