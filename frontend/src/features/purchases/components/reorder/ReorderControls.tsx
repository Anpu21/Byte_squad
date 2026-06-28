import { Select } from '@/components/ui';

const NUM_INPUT =
    'h-9 w-24 px-2 bg-surface border border-border rounded-md text-[13px] text-text-1 text-right outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/25 transition-colors';

interface IReorderControlsProps {
    leadDays: number;
    lookbackDays: number;
    onLeadDays: (n: number) => void;
    onLookbackDays: (n: number) => void;
    isAdmin: boolean;
    branchId: string;
    onBranchId: (id: string) => void;
    branchOptions: { value: string; label: string }[];
}

/** Tuning inputs for the reorder report: lead days, sales window, branch. */
export function ReorderControls({
    leadDays,
    lookbackDays,
    onLeadDays,
    onLookbackDays,
    isAdmin,
    branchId,
    onBranchId,
    branchOptions,
}: IReorderControlsProps) {
    return (
        <div className="flex flex-wrap items-end gap-4">
            {isAdmin && (
                <label className="space-y-1">
                    <span className="block text-[11px] uppercase tracking-wide text-text-3">
                        Branch
                    </span>
                    <Select
                        value={branchId}
                        onChange={onBranchId}
                        options={branchOptions}
                    />
                </label>
            )}
            <label className="space-y-1">
                <span className="block text-[11px] uppercase tracking-wide text-text-3">
                    Lead days
                </span>
                <input
                    className={NUM_INPUT}
                    type="number"
                    min={1}
                    max={90}
                    value={leadDays}
                    onChange={(e) => onLeadDays(Number(e.target.value))}
                />
            </label>
            <label className="space-y-1">
                <span className="block text-[11px] uppercase tracking-wide text-text-3">
                    Sales window (days)
                </span>
                <input
                    className={NUM_INPUT}
                    type="number"
                    min={1}
                    max={365}
                    value={lookbackDays}
                    onChange={(e) => onLookbackDays(Number(e.target.value))}
                />
            </label>
        </div>
    );
}
