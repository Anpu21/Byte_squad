import type { ITransferSourceOption } from '@/types';

interface SourceOptionsTableProps {
    options: ITransferSourceOption[];
    isLoading: boolean;
    requestedQuantity: number;
    chosenSourceId: string;
    onChoose: (branchId: string) => void;
}

export function SourceOptionsTable({
    options,
    isLoading,
    requestedQuantity,
    chosenSourceId,
    onChoose,
}: SourceOptionsTableProps) {
    if (isLoading) {
        return <div className="p-4 text-sm text-text-3">Loading branches…</div>;
    }
    if (options.length === 0) {
        return (
            <div className="p-4 text-sm text-text-3">
                No other branches found.
            </div>
        );
    }
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-[10px] uppercase tracking-widest text-text-3 border-b border-border">
                    <th className="px-4 py-2 text-left font-semibold" />
                    <th className="px-4 py-2 text-left font-semibold">Branch</th>
                    <th className="px-4 py-2 text-right font-semibold">Stock</th>
                </tr>
            </thead>
            <tbody>
                {options.map((opt) => {
                    const sufficient = opt.currentQuantity >= requestedQuantity;
                    const disabled = !opt.isActive;
                    const isChecked = chosenSourceId === opt.branchId;
                    return (
                        <tr
                            key={opt.branchId}
                            className={`border-b border-border transition-colors ${
                                disabled
                                    ? 'opacity-50'
                                    : 'hover:bg-surface-2 cursor-pointer'
                            } ${isChecked ? 'bg-surface-2' : ''}`}
                            onClick={() => !disabled && onChoose(opt.branchId)}
                        >
                            <td className="px-4 py-3 w-10">
                                <input
                                    type="radio"
                                    name="source-branch"
                                    checked={isChecked}
                                    onChange={() =>
                                        !disabled && onChoose(opt.branchId)
                                    }
                                    disabled={disabled}
                                    aria-label={`Choose ${opt.branchName}`}
                                    style={{ accentColor: 'var(--primary)' }}
                                />
                            </td>
                            <td className="px-4 py-3 text-text-1">
                                {opt.branchName}
                                {!opt.isActive && (
                                    <span className="ml-2 text-[10px] text-text-3">
                                        (inactive)
                                    </span>
                                )}
                            </td>
                            <td
                                className={`px-4 py-3 text-right tabular-nums font-medium ${
                                    sufficient
                                        ? 'text-accent-text'
                                        : 'text-warning'
                                }`}
                            >
                                {opt.currentQuantity}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
