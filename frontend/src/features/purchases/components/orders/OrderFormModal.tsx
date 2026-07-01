import { LuPlus as Plus } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useOrderForm } from './useOrderForm';
import { OrderLineTable } from './OrderLineTable';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface IOrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Raise a purchase order (intent only — Draft until sent/received). */
export function OrderFormModal({ isOpen, onClose }: IOrderFormModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New purchase order"
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            {isOpen ? <OrderForm onClose={onClose} /> : null}
        </Modal>
    );
}

function OrderForm({ onClose }: { onClose: () => void }) {
    const o = useOrderForm(onClose);

    return (
        <form onSubmit={o.handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Supplier
                    </span>
                    <select
                        className={`${INPUT_CLASS} field-select w-full`}
                        value={o.supplierId}
                        onChange={(e) => o.setSupplierId(e.target.value)}
                        required
                    >
                        <option value="" disabled>
                            {o.suppliersQuery.isLoading
                                ? 'Loading…'
                                : 'Select supplier'}
                        </option>
                        {(o.suppliersQuery.data?.rows ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </label>
                {o.isAdmin && (
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Branch
                        </span>
                        <select
                            className={`${INPUT_CLASS} field-select w-full`}
                            value={o.branchId}
                            onChange={(e) => o.setBranchId(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Select branch
                            </option>
                            {(o.branchesQuery.data ?? [])
                                .filter((b) => b.isActive)
                                .map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                        </select>
                    </label>
                )}
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Expected delivery
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full${o.expectedDate ? '' : ' date-empty'}`}
                        type="date"
                        value={o.expectedDate}
                        onChange={(e) => o.setExpectedDate(e.target.value)}
                    />
                </label>
            </div>

            <OrderLineTable
                parsed={o.parsed}
                products={o.products}
                productsLoading={o.productsQuery.isLoading}
                onPickProduct={o.pickProduct}
                onPatchLine={o.patchLine}
                onRemoveLine={o.removeLine}
            />
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={o.addLine}
                >
                    <Plus size={14} aria-hidden />
                    Add line
                </Button>
                <span className="text-sm text-text-2">
                    Order value:{' '}
                    <span className="font-semibold text-text-1 tabular-nums">
                        {formatCurrency(o.totalValue)}
                    </span>
                </span>
            </div>

            <label className="block space-y-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Notes (optional)
                </span>
                <textarea
                    className={`${FIELD_SHELL} ${FIELD_BORDER} w-full min-h-[56px] px-3 py-2`}
                    value={o.notes}
                    onChange={(e) => o.setNotes(e.target.value)}
                    maxLength={1000}
                />
            </label>

            <div className="flex justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={o.isPending}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={o.isPending || !o.canSubmit}
                >
                    {o.isPending ? 'Creating…' : 'Create order'}
                </Button>
            </div>
        </form>
    );
}
