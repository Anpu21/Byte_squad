import { useCallback, useMemo, useState } from 'react';
import type { IStockTransferRequest } from '@/types';
import { useTransferBoardData } from '../hooks/useTransferBoardData';
import { useBoardActionModal } from '../hooks/useBoardActionModal';
import {
    BoardActionContext,
    type OpenBoardAction,
} from '../context/board-action-context';
import { BOARD_COLUMNS } from '../lib/column-config';
import { TransferBoardTable } from './TransferBoardTable';
import { TransferBoardActionModalHost } from './TransferBoardActionModalHost';

/**
 * Transfer pipeline console. A glanceable stage strip (counts per workflow
 * stage, which double as filters) over an action list with explicit
 * Approve/Reject/Ship/Receive/Cancel buttons. Replaces the drag-and-drop
 * board — every action is direct and keyboard/touch accessible.
 */
export function TransferBoard() {
    const data = useTransferBoardData();
    const modal = useBoardActionModal();
    const [stage, setStage] = useState<string>('all');

    const openAction = useCallback<OpenBoardAction>(
        (transfer: IStockTransferRequest, action) => {
            modal.open({
                transferId: transfer.id,
                action,
                requestedQuantity: transfer.requestedQuantity,
            });
        },
        [modal],
    );

    const { counts, total } = useMemo(() => {
        const c: Record<string, number> = {};
        let t = 0;
        for (const col of BOARD_COLUMNS) {
            const n = (data.columns[col.id] ?? []).reduce(
                (sum, group) => sum + group.transfers.length,
                0,
            );
            c[col.id] = n;
            t += n;
        }
        return { counts: c, total: t };
    }, [data.columns]);

    const rows = useMemo<IStockTransferRequest[]>(() => {
        const ids =
            stage === 'all' ? BOARD_COLUMNS.map((col) => col.id) : [stage];
        const all = ids.flatMap((id) =>
            (data.columns[id] ?? []).flatMap((group) => group.transfers),
        );
        return all.sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        );
    }, [data.columns, stage]);

    return (
        <BoardActionContext.Provider value={openAction}>
            <div
                className="flex flex-wrap items-center gap-2 mb-4"
                role="tablist"
                aria-label="Filter transfers by stage"
            >
                <StageChip
                    label="All"
                    count={total}
                    active={stage === 'all'}
                    onClick={() => setStage('all')}
                />
                {BOARD_COLUMNS.map((col) => (
                    <StageChip
                        key={col.id}
                        label={col.label}
                        count={counts[col.id] ?? 0}
                        dotClass={col.dotClass}
                        active={stage === col.id}
                        onClick={() => setStage(col.id)}
                    />
                ))}
            </div>

            <TransferBoardTable rows={rows} isLoading={data.isLoading} />

            <TransferBoardActionModalHost modal={modal} />
        </BoardActionContext.Provider>
    );
}

function StageChip({
    label,
    count,
    dotClass,
    active,
    onClick,
}: {
    label: string;
    count: number;
    dotClass?: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl border transition-all focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
                active
                    ? 'border-primary bg-primary-soft'
                    : 'border-border bg-surface hover:border-border-strong'
            }`}
        >
            {dotClass && (
                <span
                    className={`w-2 h-2 rounded-full ${dotClass}`}
                    aria-hidden="true"
                />
            )}
            <span
                className={`text-[13px] font-medium ${
                    active ? 'text-primary-soft-text' : 'text-text-2'
                }`}
            >
                {label}
            </span>
            <span
                className={`text-[13px] font-bold tabular-nums ${
                    active ? 'text-primary-soft-text' : 'text-text-1'
                }`}
            >
                {count}
            </span>
        </button>
    );
}
