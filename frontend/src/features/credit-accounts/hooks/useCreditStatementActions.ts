import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { useConfirm } from '@/hooks/useConfirm';
import type { CreditAccountPaymentMethod } from '@/types';
import { useCreditAccountStatement } from './useCreditAccountStatement';
import { useReceiveCreditAccountPayment } from './useReceiveCreditAccountPayment';
import { useUpdateCreditAccount } from './useUpdateCreditAccount';
import { useSuspendCreditAccount } from './useSuspendCreditAccount';
import { useCloseCreditAccount } from './useCloseCreditAccount';

function extractError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

/**
 * Statement data + the four write actions (receive payment, edit limit/term,
 * suspend, close) with their local draft state and confirms. The modal is a
 * thin view over this.
 */
export function useCreditStatementActions(
  accountId: string | null,
  onClose: () => void,
) {
  const confirm = useConfirm();
  const statementQuery = useCreditAccountStatement(accountId);
  const receivePayment = useReceiveCreditAccountPayment();
  const updateAccount = useUpdateCreditAccount();
  const suspendAccount = useSuspendCreditAccount();
  const closeAccount = useCloseCreditAccount();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<CreditAccountPaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [limitDraft, setLimitDraft] = useState('');
  const [termDraft, setTermDraft] = useState('');

  const statement = statementQuery.data;
  const amountNum = Number(amount);
  const canReceive =
    Number.isFinite(amountNum) && amountNum > 0 && !receivePayment.isPending;

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId || !canReceive) return;
    try {
      const updated = await receivePayment.mutateAsync({
        id: accountId,
        payload: {
          amount: amountNum,
          method,
          notes: notes.trim() || undefined,
        },
      });
      toast.success(
        `Received ${formatCurrency(amountNum)} — balance ${formatCurrency(updated.currentBalance)}`,
      );
      setAmount('');
      setNotes('');
    } catch (err: unknown) {
      toast.error(extractError(err, 'Could not record the payment'));
    }
  }

  async function handleSaveLimitTerm() {
    if (!accountId) return;
    const payload: { creditLimit?: number; creditTermDays?: number } = {};
    if (limitDraft !== '') payload.creditLimit = Number(limitDraft);
    if (termDraft !== '') payload.creditTermDays = Number(termDraft);
    if (
      payload.creditLimit === undefined &&
      payload.creditTermDays === undefined
    )
      return;
    try {
      await updateAccount.mutateAsync({ id: accountId, payload });
      toast.success('Account updated');
      setLimitDraft('');
      setTermDraft('');
    } catch (err: unknown) {
      toast.error(extractError(err, 'Could not update the account'));
    }
  }

  async function handleSuspend() {
    if (!accountId) return;
    const ok = await confirm({
      title: 'Suspend this account?',
      body: 'The customer cannot take on new credit while suspended. Existing balances and repayments are unaffected.',
      confirmLabel: 'Suspend',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await suspendAccount.mutateAsync(accountId);
      toast.success('Account suspended');
    } catch (err: unknown) {
      toast.error(extractError(err, 'Could not suspend the account'));
    }
  }

  async function handleClose() {
    if (!accountId) return;
    const ok = await confirm({
      title: 'Close this account?',
      body: 'Closing stops all future credit on this account. This cannot be undone from here.',
      confirmLabel: 'Close account',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await closeAccount.mutateAsync(accountId);
      toast.success('Account closed');
      onClose();
    } catch (err: unknown) {
      toast.error(extractError(err, 'Could not close the account'));
    }
  }

  const isActive = statement?.status === 'ACTIVE';
  const isSuspended = statement?.status === 'SUSPENDED';
  const canRepay =
    statement != null &&
    statement.currentBalance > 0 &&
    (isActive || isSuspended);

  return {
    statement,
    amount,
    setAmount,
    method,
    setMethod,
    notes,
    setNotes,
    limitDraft,
    setLimitDraft,
    termDraft,
    setTermDraft,
    canReceive,
    receivePayment,
    updateAccount,
    suspendAccount,
    closeAccount,
    handleReceive,
    handleSaveLimitTerm,
    handleSuspend,
    handleClose,
    isActive,
    isSuspended,
    canRepay,
  };
}
