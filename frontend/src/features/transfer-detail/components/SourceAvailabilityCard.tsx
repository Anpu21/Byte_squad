import { useSourceOptionsQuery } from '../hooks/useSourceOptionsQuery';
import { SourceOptionsTable } from './SourceOptionsTable';

interface SourceAvailabilityCardProps {
    transferId: string;
    requestedQuantity: number;
    onChoose: (branchId: string) => void;
}

export function SourceAvailabilityCard({
    transferId,
    requestedQuantity,
    onChoose,
}: SourceAvailabilityCardProps) {
    const query = useSourceOptionsQuery(transferId, true);

    return (
        <div className="bg-surface border border-border rounded-md p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-3">
                        Source availability
                    </p>
                    <h2 className="text-base font-bold text-text-1 mt-0.5">
                        Where this product is in stock
                    </h2>
                </div>
                <span className="text-[11px] text-text-3 text-right shrink-0">
                    Click a branch to approve from it
                </span>
            </div>
            <div className="bg-canvas border border-border rounded-xl overflow-hidden">
                <SourceOptionsTable
                    options={query.data ?? []}
                    isLoading={query.isLoading}
                    requestedQuantity={requestedQuantity}
                    chosenSourceId=""
                    onChoose={onChoose}
                />
            </div>
        </div>
    );
}
