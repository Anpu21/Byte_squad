import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { accountingService } from '@/services/accounting.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

interface IJournalLineDraft {
    key: number;
    accountId: string;
    entryType: 'debit' | 'credit';
    amount: string;
    description: string;
}

let journalLineKey = 0;
const emptyLine = (entryType: 'debit' | 'credit'): IJournalLineDraft => ({
    key: ++journalLineKey,
    accountId: '',
    entryType,
    amount: '',
    description: '',
});

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
    const queryClient = useQueryClient();
    const [memo, setMemo] = useState('');
    const [entryDate, setEntryDate] = useState('');
    const [branchId, setBranchId] = useState('');
    const [lines, setLines] = useState<IJournalLineDraft[]>([
        emptyLine('debit'),
        emptyLine('credit'),
    ]);
    const [busy, setBusy] = useState(false);

    const accountsQuery = useQuery({
        queryKey: queryKeys.ledger.accounts(),
        queryFn: accountingService.listAccounts,
        enabled: isOpen,
    });
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
        enabled: isOpen,
    });

    function patchLine(key: number, patch: Partial<IJournalLineDraft>) {
        setLines((prev) =>
            prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
        );
    }

    const parsed = lines.map((l) => ({ ...l, amountNum: Number(l.amount) }));
    const complete = parsed.filter(
        (l) =>
            l.accountId &&
            Number.isFinite(l.amountNum) &&
            l.amountNum > 0,
    );
    const debits = complete
        .filter((l) => l.entryType === 'debit')
        .reduce((s, l) => s + l.amountNum, 0);
    const credits = complete
        .filter((l) => l.entryType === 'credit')
        .reduce((s, l) => s + l.amountNum, 0);
    const balanced =
        Math.round(debits * 100) === Math.round(credits * 100) && debits > 0;
    const canSubmit =
        memo.trim().length >= 3 &&
        branchId.length > 0 &&
        complete.length === parsed.length &&
        complete.length >= 2 &&
        balanced &&
        !busy;

    function reset() {
        setMemo('');
        setEntryDate('');
        setBranchId('');
        setLines([emptyLine('debit'), emptyLine('credit')]);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;
        setBusy(true);
        try {
            const voucher = await accountingService.createJournal({
                branchId,
                entryDate: entryDate || undefined,
                memo: memo.trim(),
                lines: complete.map((l) => ({
                    accountId: l.accountId,
                    entryType: l.entryType,
                    amount: l.amountNum,
                    description: l.description.trim() || undefined,
                })),
            });
            toast.success(`${voucher.voucherNumber} posted`);
            void queryClient.invalidateQueries({ queryKey: ['ledger'] });
            reset();
            onClose();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not post the journal');
            } else {
                toast.error('Could not post the journal');
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New journal voucher"
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="block space-y-1.5 sm:col-span-1">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Branch
                        </span>
                        <select
                            className={`${INPUT_CLASS} w-full`}
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Select branch
                            </option>
                            {(branchesQuery.data ?? [])
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
                            className={`${INPUT_CLASS} w-full`}
                            type="date"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                        />
                    </label>
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Memo
                        </span>
                        <input
                            className={`${INPUT_CLASS} w-full`}
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="Why this adjustment?"
                            minLength={3}
                            maxLength={500}
                            required
                        />
                    </label>
                </div>

                <div className="overflow-x-auto border border-border rounded-md">
                    <table className="w-full text-left">
                        <thead className="bg-surface-2/60 border-b border-border">
                            <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                <th className="px-2 py-2 font-medium min-w-[200px]">
                                    Account
                                </th>
                                <th className="px-2 py-2 font-medium w-24">
                                    Side
                                </th>
                                <th className="px-2 py-2 font-medium w-28">
                                    Amount
                                </th>
                                <th className="px-2 py-2 font-medium">
                                    Description
                                </th>
                                <th className="px-2 py-2 w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {parsed.map((line) => (
                                <tr
                                    key={line.key}
                                    className="border-b border-border last:border-b-0"
                                >
                                    <td className="px-2 py-1.5">
                                        <select
                                            className={`${INPUT_CLASS} w-full h-8`}
                                            value={line.accountId}
                                            onChange={(e) =>
                                                patchLine(line.key, {
                                                    accountId: e.target.value,
                                                })
                                            }
                                            aria-label="Account"
                                        >
                                            <option value="">
                                                {accountsQuery.isLoading
                                                    ? 'Loading…'
                                                    : 'Select account'}
                                            </option>
                                            {(accountsQuery.data ?? []).map(
                                                (a) => (
                                                    <option
                                                        key={a.id}
                                                        value={a.id}
                                                    >
                                                        {a.code} — {a.name}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <select
                                            className={`${INPUT_CLASS} w-full h-8`}
                                            value={line.entryType}
                                            onChange={(e) =>
                                                patchLine(line.key, {
                                                    entryType: e.target
                                                        .value as
                                                        | 'debit'
                                                        | 'credit',
                                                })
                                            }
                                            aria-label="Debit or credit"
                                        >
                                            <option value="debit">
                                                Debit
                                            </option>
                                            <option value="credit">
                                                Credit
                                            </option>
                                        </select>
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            className={`${INPUT_CLASS} w-full h-8 text-right`}
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={line.amount}
                                            onChange={(e) =>
                                                patchLine(line.key, {
                                                    amount: e.target.value,
                                                })
                                            }
                                            aria-label="Amount"
                                        />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input
                                            className={`${INPUT_CLASS} w-full h-8`}
                                            value={line.description}
                                            onChange={(e) =>
                                                patchLine(line.key, {
                                                    description:
                                                        e.target.value,
                                                })
                                            }
                                            maxLength={255}
                                            aria-label="Line description"
                                        />
                                    </td>
                                    <td className="px-2 py-1.5 text-right">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setLines((prev) =>
                                                    prev.length > 2
                                                        ? prev.filter(
                                                              (l) =>
                                                                  l.key !==
                                                                  line.key,
                                                          )
                                                        : prev,
                                                )
                                            }
                                            aria-label="Remove line"
                                            className="inline-flex items-center justify-center w-7 h-7 rounded text-text-3 hover:text-danger hover:bg-danger-soft transition-colors disabled:opacity-40"
                                            disabled={parsed.length <= 2}
                                        >
                                            <Trash2 size={14} aria-hidden />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                            setLines((prev) => [...prev, emptyLine('debit')])
                        }
                    >
                        <Plus size={14} aria-hidden />
                        Add line
                    </Button>
                    <span
                        className={`text-sm tabular-nums ${
                            balanced ? 'text-accent-text' : 'text-warning'
                        }`}
                    >
                        Dr {formatCurrency(debits)} · Cr{' '}
                        {formatCurrency(credits)}
                        {balanced ? ' · balanced ✓' : ' · out of balance'}
                    </span>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={busy}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!canSubmit}
                    >
                        {busy ? 'Posting…' : 'Post journal'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
