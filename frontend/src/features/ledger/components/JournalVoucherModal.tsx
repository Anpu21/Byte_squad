import { LuPlus as Plus } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useJournalVoucher } from './useJournalVoucher';
import { JournalLineTable } from './JournalLineTable';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface IJournalVoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Balanced manual journal entry (admin). Lines post as real ledger rows
 * against chart accounts; the footer keeps a live Σ debits vs Σ credits
 * so an unbalanced voucher can't be submitted.
 */
export function JournalVoucherModal({
    isOpen,
    onClose,
}: IJournalVoucherModalProps) {
    const j = useJournalVoucher(isOpen, onClose);

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (!j.busy) onClose();
            }}
            title="New journal voucher"
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            <form onSubmit={j.handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="block space-y-1.5 sm:col-span-1">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Branch
                        </span>
                        <select
                            className={`${INPUT_CLASS} field-select w-full`}
                            value={j.branchId}
                            onChange={(e) => j.setBranchId(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Select branch
                            </option>
                            {(j.branchesQuery.data ?? [])
                                .filter((b) => b.isActive)
                                .map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                        </select>
                    </label>
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Entry date
                        </span>
                        <input
                            className={`${INPUT_CLASS} w-full${j.entryDate ? '' : ' date-empty'}`}
                            type="date"
                            value={j.entryDate}
                            max={j.maxDate}
                            onChange={(e) => j.setEntryDate(e.target.value)}
                        />
                    </label>
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Memo
                        </span>
                        <input
                            className={`${INPUT_CLASS} w-full`}
                            value={j.memo}
                            onChange={(e) => j.setMemo(e.target.value)}
                            placeholder="Why this adjustment?"
                            minLength={3}
                            maxLength={500}
                            required
                        />
                    </label>
                </div>

                <JournalLineTable
                    parsed={j.parsed}
                    accounts={j.accountsQuery.data ?? []}
                    accountsLoading={j.accountsQuery.isLoading}
                    onPatchLine={j.patchLine}
                    onRemoveLine={j.removeLine}
                />

                <div className="flex items-center justify-between">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={j.addLine}
                    >
                        <Plus size={14} aria-hidden />
                        Add line
                    </Button>
                    <span
                        className={`text-sm tabular-nums ${
                            j.balanced ? 'text-accent-text' : 'text-warning'
                        }`}
                    >
                        Dr {formatCurrency(j.debits)} · Cr{' '}
                        {formatCurrency(j.credits)}
                        {j.balanced ? ' · balanced ✓' : ' · out of balance'}
                    </span>
                </div>

                {j.duplicateAccount && (
                    <p className="text-[11px] text-warning">
                        The same account is on more than one line — double-check
                        this is intentional.
                    </p>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-text-3" aria-live="polite">
                        {j.disabledReason}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={j.busy}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!j.canSubmit}
                        >
                            {j.busy ? 'Posting…' : 'Post journal'}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
