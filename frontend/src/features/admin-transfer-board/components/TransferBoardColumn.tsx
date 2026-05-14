import type { IStockTransferRequest } from '@/types';
import type { BoardColumnConfig } from '../lib/column-config';
import { TransferBoardCard } from './TransferBoardCard';

interface TransferBoardColumnProps {
    column: BoardColumnConfig;
    transfers: IStockTransferRequest[];
    isLoading: boolean;
}

export function TransferBoardColumn({
    column,
    transfers,
    isLoading,
}: TransferBoardColumnProps) {
    return (
        <section
            aria-label={column.label}
            className="flex-shrink-0 w-[300px] bg-surface-2 border border-border rounded-md flex flex-col max-h-[calc(100vh-13rem)]"
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
                    {transfers.length}
                </span>
            </header>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {isLoading ? (
                    <div className="space-y-2" aria-hidden>
                        <div className="h-16 bg-surface rounded-md animate-pulse" />
                        <div className="h-16 bg-surface rounded-md animate-pulse" />
                    </div>
                ) : transfers.length === 0 ? (
                    <p className="text-[12px] text-text-3 text-center py-6">
                        No items
                    </p>
                ) : (
                    transfers.map((transfer) => (
                        <TransferBoardCard
                            key={transfer.id}
                            transfer={transfer}
                        />
                    ))
                )}
            </div>
        </section>
    );
}
