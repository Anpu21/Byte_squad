import { useCallback, useState, type ReactNode } from 'react';
import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import type { IStockTransferRequest } from '@/types';
import { useTransferBoardData } from '../hooks/useTransferBoardData';
import {
    useBoardActionModal,
    type BoardModalAction,
} from '../hooks/useBoardActionModal';
import { BOARD_COLUMNS } from '../lib/column-config';
import { getDropAction } from '../lib/allowed-transitions';
import {
    BoardActionContext,
    type OpenBoardAction,
} from '../context/board-action-context';
import { TransferBoardColumn } from './TransferBoardColumn';
import { TransferBoardActionModalHost } from './TransferBoardActionModalHost';
import { TransferBoardTable } from './TransferBoardTable';

interface DragData {
    transferId: string;
    fromColumnId: string;
    requestedQuantity: number;
}

type BoardView = 'board' | 'table';

export function TransferBoard() {
    const data = useTransferBoardData();
    const modal = useBoardActionModal();
    const [view, setView] = useState<BoardView>('board');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor),
    );

    const openAction = useCallback<OpenBoardAction>(
        (transfer: IStockTransferRequest, action: BoardModalAction) => {
            modal.open({
                transferId: transfer.id,
                action,
                requestedQuantity: transfer.requestedQuantity,
            });
        },
        [modal],
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const dragData = active.data.current as DragData | undefined;
        if (!dragData) return;
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
            transferId: dragData.transferId,
            action: action as BoardModalAction,
            requestedQuantity: dragData.requestedQuantity,
        });
    };

    return (
        <BoardActionContext.Provider value={openAction}>
            <div
                className="flex items-center gap-1 mb-4 p-1 bg-surface-2 rounded-xl border border-border w-fit"
                role="tablist"
                aria-label="Board layout"
            >
                <ViewToggle
                    active={view === 'board'}
                    onClick={() => setView('board')}
                    icon={<LayoutGrid size={14} />}
                    label="Board"
                />
                <ViewToggle
                    active={view === 'table'}
                    onClick={() => setView('table')}
                    icon={<TableIcon size={14} />}
                    label="Table"
                />
            </div>

            {view === 'board' ? (
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
                </DndContext>
            ) : (
                <TransferBoardTable data={data} />
            )}

            <TransferBoardActionModalHost modal={modal} />
        </BoardActionContext.Provider>
    );
}

function ViewToggle({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
                active
                    ? 'bg-primary text-text-inv shadow-sm'
                    : 'text-text-2 hover:text-text-1'
            }`}
        >
            {icon}
            {label}
        </button>
    );
}
