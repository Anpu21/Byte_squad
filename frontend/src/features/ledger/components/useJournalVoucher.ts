import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { accountingService } from '@/services/accounting.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import {
    type IJournalLineDraft,
    deriveJournalTotals,
    emptyLine,
    todayIsoDate,
} from './journal-voucher.lib';

/**
 * Manual journal-voucher state: header (branch/date/memo), the balanced
 * debit/credit lines, and the post submit (guards an unbalanced voucher).
 */
export function useJournalVoucher(isOpen: boolean, onClose: () => void) {
    const queryClient = useQueryClient();
    const maxDate = todayIsoDate();
    const [memo, setMemo] = useState('');
    const [entryDate, setEntryDate] = useState(maxDate);
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

    function addLine() {
        setLines((prev) => [...prev, emptyLine('debit')]);
    }

    function removeLine(key: number) {
        setLines((prev) =>
            prev.length > 2 ? prev.filter((l) => l.key !== key) : prev,
        );
    }

    const { parsed, complete, debits, credits, balanced, duplicateAccount } =
        deriveJournalTotals(lines);
    const futureDate = entryDate.length > 0 && entryDate > maxDate;
    const canSubmit =
        memo.trim().length >= 3 &&
        branchId.length > 0 &&
        complete.length === parsed.length &&
        complete.length >= 2 &&
        balanced &&
        !futureDate &&
        !busy;

    // Short, human hint for why Post is disabled (shown next to the button).
    const disabledReason = ((): string | null => {
        if (busy || canSubmit) return null;
        if (branchId.length === 0) return 'Choose a branch';
        if (memo.trim().length < 3) return 'Add a memo (3+ characters)';
        if (complete.length < 2) return 'Add at least two complete lines';
        if (complete.length !== parsed.length)
            return 'Every line needs an account and amount';
        if (futureDate) return "Entry date can't be in the future";
        if (!balanced) return 'Debits and credits must balance';
        return null;
    })();

    const reset = useCallback(() => {
        setMemo('');
        setEntryDate(todayIsoDate());
        setBranchId('');
        setLines([emptyLine('debit'), emptyLine('credit')]);
    }, []);

    // Clear any stale draft each time the modal opens — a cancelled voucher
    // shouldn't reappear half-filled.
    useEffect(() => {
        if (isOpen) reset();
    }, [isOpen, reset]);

    async function handleSubmit(e: FormEvent) {
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

    return {
        memo,
        setMemo,
        entryDate,
        setEntryDate,
        branchId,
        setBranchId,
        busy,
        accountsQuery,
        branchesQuery,
        parsed,
        debits,
        credits,
        balanced,
        duplicateAccount,
        canSubmit,
        disabledReason,
        maxDate,
        patchLine,
        addLine,
        removeLine,
        handleSubmit,
    };
}
