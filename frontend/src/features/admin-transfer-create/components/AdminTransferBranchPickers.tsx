import { ArrowLeftRight } from 'lucide-react';
import type { IBranch } from '@/types';

const SELECT_CLASS =
    'w-full h-9 px-3 bg-canvas border border-border rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/25 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const LABEL_CLASS =
    'block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5';

interface AdminTransferBranchPickersProps {
    branches: IBranch[];
    sourceBranchId: string;
    destinationBranchId: string;
    onSourceChange: (id: string) => void;
    onDestinationChange: (id: string) => void;
    onSwap: () => void;
    isLoading: boolean;
}

export function AdminTransferBranchPickers({
    branches,
    sourceBranchId,
    destinationBranchId,
    onSourceChange,
    onDestinationChange,
    onSwap,
    isLoading,
}: AdminTransferBranchPickersProps) {
    const canSwap = Boolean(sourceBranchId) && Boolean(destinationBranchId);

    return (
        <div className="bg-surface border border-border rounded-md shadow-md-token p-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:items-end">
                <div>
                    <label htmlFor="transfer-source" className={LABEL_CLASS}>
                        Source branch
                    </label>
                    <select
                        id="transfer-source"
                        value={sourceBranchId}
                        onChange={(e) => onSourceChange(e.target.value)}
                        className={SELECT_CLASS}
                        disabled={isLoading || branches.length === 0}
                    >
                        <option value="">Pick source branch…</option>
                        {branches.map((branch) => (
                            <option
                                key={branch.id}
                                value={branch.id}
                                disabled={branch.id === destinationBranchId}
                            >
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={onSwap}
                    disabled={!canSwap}
                    aria-label="Swap source and destination"
                    title="Swap source and destination"
                    className="h-9 w-9 self-end justify-self-center rounded-md border border-border bg-surface-2 text-text-2 hover:text-text-1 hover:border-border-strong hover:bg-surface transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                >
                    <ArrowLeftRight size={14} strokeWidth={2} />
                </button>

                <div>
                    <label htmlFor="transfer-destination" className={LABEL_CLASS}>
                        Destination branch
                    </label>
                    <select
                        id="transfer-destination"
                        value={destinationBranchId}
                        onChange={(e) => onDestinationChange(e.target.value)}
                        className={SELECT_CLASS}
                        disabled={isLoading || branches.length === 0}
                    >
                        <option value="">Pick destination branch…</option>
                        {branches.map((branch) => (
                            <option
                                key={branch.id}
                                value={branch.id}
                                disabled={branch.id === sourceBranchId}
                            >
                                {branch.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
