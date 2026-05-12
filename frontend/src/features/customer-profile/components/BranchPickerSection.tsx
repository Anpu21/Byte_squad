import { Check, Loader2, MapPin } from 'lucide-react';
import type { IUserProfile } from '@/types';

interface Branch {
    id: string;
    name: string;
}

interface BranchPickerSectionProps {
    branch: IUserProfile['branch'] | undefined;
    branches: Branch[];
    branchesLoading: boolean;
    selectedBranchId: string;
    setSelectedBranchId: (v: string) => void;
    isSaving: boolean;
    onSave: (branchId: string) => void;
}

export function BranchPickerSection({
    branch,
    branches,
    branchesLoading,
    selectedBranchId,
    setSelectedBranchId,
    isSaving,
    onSave,
}: BranchPickerSectionProps) {
    return (
        <section className="bg-surface border border-border rounded-md overflow-hidden">
            <header className="px-6 py-4 border-b border-border flex items-center gap-2">
                <MapPin size={15} className="text-text-2" />
                <h2 className="text-sm font-semibold text-text-1">
                    Pickup branch
                </h2>
            </header>
            <div className="px-6 py-5 space-y-4">
                <div className="min-w-0">
                    {branch ? (
                        <>
                            <p className="text-base font-semibold text-text-1 truncate">
                                {branch.name}
                            </p>
                            {branch.address && (
                                <p className="text-xs text-text-2 mt-1">
                                    {branch.address}
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-text-1">
                                No branch selected
                            </p>
                            <p className="text-xs text-text-2 mt-1">
                                Pick a branch to start placing pickup orders.
                            </p>
                        </>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1 min-w-0">
                        <label
                            htmlFor="branch-picker"
                            className="block text-xs font-medium text-text-2 mb-1.5"
                        >
                            {branch ? 'Change branch' : 'Choose a branch'}
                        </label>
                        <select
                            id="branch-picker"
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            disabled={branchesLoading || isSaving}
                            className="w-full h-[38px] px-3 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {branchesLoading ? (
                                <option value="">Loading branches…</option>
                            ) : (
                                <>
                                    {!selectedBranchId && (
                                        <option value="">
                                            Select a branch…
                                        </option>
                                    )}
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            selectedBranchId && onSave(selectedBranchId)
                        }
                        disabled={
                            !selectedBranchId ||
                            selectedBranchId === branch?.id ||
                            isSaving
                        }
                        className="inline-flex items-center justify-center gap-1.5 h-[38px] px-4 rounded-md bg-primary text-text-inv text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <Check size={14} />
                                Save branch
                            </>
                        )}
                    </button>
                </div>
            </div>
        </section>
    );
}
