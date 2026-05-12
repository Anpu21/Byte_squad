import type { TransferStatus } from '@/constants/enums';
import type { IBranchWithMeta, IProduct } from '@/types';
import { HISTORY_STATUSES } from '../lib/statuses';
import { ProductTypeahead } from './ProductTypeahead';

const INPUT_CLASS =
    'w-full h-10 px-3 bg-canvas border border-border rounded-lg text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all';

export interface TransferHistoryFilterValues {
    selectedStatuses: TransferStatus[];
    from: string;
    to: string;
    selectedProduct: IProduct | null;
    branchId: string;
}

export interface TransferHistoryFilterActions {
    toggleStatus: (status: TransferStatus) => void;
    setFrom: (v: string) => void;
    setTo: (v: string) => void;
    selectProduct: (id: string) => void;
    clearProduct: () => void;
    setBranchId: (v: string) => void;
}

interface TransferHistoryFiltersProps {
    isAdmin: boolean;
    filters: TransferHistoryFilterValues;
    actions: TransferHistoryFilterActions;
    products: IProduct[];
    branches: IBranchWithMeta[];
}

export function TransferHistoryFilters({
    isAdmin,
    filters,
    actions,
    products,
    branches,
}: TransferHistoryFiltersProps) {
    return (
        <div className="bg-surface border border-border rounded-md p-5 mb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mr-1">
                    Status
                </span>
                {HISTORY_STATUSES.map((s) => {
                    const isSelected = filters.selectedStatuses.includes(s.key);
                    return (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => actions.toggleStatus(s.key)}
                            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                                isSelected
                                    ? 'bg-primary text-text-inv shadow-sm'
                                    : 'bg-surface-2 border border-border text-text-2 hover:text-text-1 hover:bg-surface-2'
                            }`}
                            aria-pressed={isSelected}
                        >
                            {s.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label
                        htmlFor="th-from"
                        className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2"
                    >
                        From
                    </label>
                    <input
                        id="th-from"
                        type="date"
                        value={filters.from}
                        max={filters.to || undefined}
                        onChange={(e) => actions.setFrom(e.target.value)}
                        className={INPUT_CLASS}
                    />
                </div>
                <div>
                    <label
                        htmlFor="th-to"
                        className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2"
                    >
                        To
                    </label>
                    <input
                        id="th-to"
                        type="date"
                        value={filters.to}
                        min={filters.from || undefined}
                        onChange={(e) => actions.setTo(e.target.value)}
                        className={INPUT_CLASS}
                    />
                </div>
                <div>
                    <span className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                        Product
                    </span>
                    <ProductTypeahead
                        products={products}
                        selectedProduct={filters.selectedProduct}
                        onSelect={actions.selectProduct}
                        onClear={actions.clearProduct}
                    />
                </div>
                {isAdmin && (
                    <div>
                        <label
                            htmlFor="th-branch"
                            className="block text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2"
                        >
                            Branch
                        </label>
                        <select
                            id="th-branch"
                            value={filters.branchId}
                            onChange={(e) => actions.setBranchId(e.target.value)}
                            className={INPUT_CLASS}
                        >
                            <option value="">All branches</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
