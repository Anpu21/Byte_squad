import { useDroppable } from '@dnd-kit/core';
import type { BoardColumnConfig } from '../lib/column-config';
import type { TransferBoardGroup } from '../types/transfer-board-group.type';
import { getDropAction } from '../lib/allowed-transitions';
import { TransferBoardCard } from './TransferBoardCard';

interface TransferBoardColumnProps {
    column: BoardColumnConfig;
    groups: TransferBoardGroup[];
    isLoading: boolean;
}

interface DragDataShape {
    fromColumnId?: string;
}

export function TransferBoardColumn({
    column,
    groups,
    isLoading,
}: TransferBoardColumnProps) {
    const { setNodeRef, isOver, active } = useDroppable({ id: column.id });

    const dragData = active?.data.current as DragDataShape | undefined;
    const action =
        dragData && dragData.fromColumnId
            ? getDropAction(dragData.fromColumnId, column.id)
            : null;
    const showHighlight = isOver && Boolean(action);
    const showForbidden =
        isOver &&
        !action &&
        Boolean(dragData?.fromColumnId) &&
        dragData?.fromColumnId !== column.id;

    return (
        <section
            ref={setNodeRef}
            aria-label={column.label}
            className={`flex-shrink-0 w-[300px] bg-surface-2 border rounded-md flex flex-col max-h-[calc(100vh-13rem)] transition-colors ${
                showHighlight
                    ? 'border-primary bg-primary-soft/30 ring-[3px] ring-primary/25'
                    : showForbidden
                      ? 'border-danger/60 bg-danger-soft/20'
                      : 'border-border'
            }`}
        >
            <header className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        aria-hidden
                        className={`inline-block w-2 h-2 rounded-full ${column.dotClass}`}
                    />
                    <h3 className="text-[11px] uppercase tracking-[0.1em] text-text-2 font-semibold truncate">
                        {column.label}
                    </h3>
                </div>
                <span className="text-[11px] font-semibold text-text-2 bg-surface border border-border rounded-full px-1.5 py-0.5 tabular-nums min-w-[20px] text-center">
                    {groups.length}
                </span>
            </header>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {isLoading ? (
                    <div className="space-y-2" aria-hidden>
                        <div className="h-16 bg-surface rounded-md animate-pulse" />
                        <div className="h-16 bg-surface rounded-md animate-pulse" />
                    </div>
                ) : groups.length === 0 ? (
                    <p className="text-[12px] text-text-3 text-center py-6">
                        {showForbidden ? 'Cannot drop here' : 'No items'}
                    </p>
                ) : (
                    groups.map((group) => (
                        <TransferBoardCard key={group.key} group={group} />
                    ))
                )}
            </div>
        </section>
    );
}
