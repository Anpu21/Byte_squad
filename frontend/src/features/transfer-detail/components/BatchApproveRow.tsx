import type { IStockTransferRequest } from '@/types';
import { useSourceOptionsQuery } from '../hooks/useSourceOptionsQuery';
import { SourceOptionsTable } from './SourceOptionsTable';

interface BatchApproveRowProps {
    transfer: IStockTransferRequest;
    chosenSourceId: string;
    onChoose: (branchId: string) => void;
    isOpen: boolean;
}

export function BatchApproveRow({
    transfer,
    chosenSourceId,
    onChoose,
    isOpen,
}: BatchApproveRowProps) {
    const query = useSourceOptionsQuery(transfer.id, isOpen);

    return (
        <div className="border border-border rounded-xl p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-text-1 truncate">
                    {transfer.product?.name ?? 'Untitled product'}
                </p>
                <span className="text-[11px] text-text-3 tabular-nums shrink-0">
                    Requested: {transfer.requestedQuantity} unit(s)
                </span>
            </div>
            <div className="bg-canvas border border-border rounded-lg max-h-48 overflow-y-auto">
                <SourceOptionsTable
                    options={query.data ?? []}
                    isLoading={query.isLoading && isOpen}
                    requestedQuantity={transfer.requestedQuantity}
                    chosenSourceId={chosenSourceId}
                    onChoose={onChoose}
                    radioName={`source-branch-${transfer.id}`}
                />
            </div>
        </div>
    );
}
