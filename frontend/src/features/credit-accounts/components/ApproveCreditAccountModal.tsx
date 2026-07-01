import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { ICreditAccountRow } from '@/types';
import { useApproveCreditAccount } from '../hooks/useApproveCreditAccount';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface ApproveCreditAccountModalProps {
  account: ICreditAccountRow | null;
  onClose: () => void;
}

/** Outer wrapper — mounts a fresh form per open so drafts never leak across rows. */
export function ApproveCreditAccountModal({
  account,
  onClose,
}: ApproveCreditAccountModalProps) {
  return (
    <Modal
      isOpen={account !== null}
      onClose={onClose}
      title={
        account ? `Approve ${account.holderName}` : 'Approve credit account'
      }
      maxWidth="md"
      closeOnBackdrop={false}
    >
      {account ? <ApproveForm account={account} onClose={onClose} /> : null}
    </Modal>
  );
}

function ApproveForm({
  account,
  onClose,
}: {
  account: ICreditAccountRow;
  onClose: () => void;
}) {
  const approve = useApproveCreditAccount();
  const [creditLimit, setCreditLimit] = useState(
    account.requestedCreditLimit !== null
      ? String(account.requestedCreditLimit)
      : '',
  );
  const [creditTermDays, setCreditTermDays] = useState('30');
  const [approvalNote, setApprovalNote] = useState('');

  const limitNum = Number(creditLimit);
  const termNum = Number(creditTermDays);
  const canSubmit =
    Number.isFinite(limitNum) &&
    limitNum >= 1 &&
    Number.isInteger(termNum) &&
    termNum >= 1 &&
    termNum <= 365 &&
    !approve.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await approve.mutateAsync({
        id: account.id,
        payload: {
          creditLimit: limitNum,
          creditTermDays: termNum,
          approvalNote: approvalNote.trim() || undefined,
        },
      });
      toast.success(
        `${account.holderName} approved — limit ${formatCurrency(limitNum)}, ${termNum}-day term`,
      );
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        toast.error(data?.message ?? 'Could not approve the account');
      } else {
        toast.error('Could not approve the account');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-text-2">
        Set a maximum credit limit and a repayment window. The customer can buy
        on credit up to the limit; each bill is due {creditTermDays || '—'} days
        after purchase.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-[11px] uppercase tracking-wide text-text-3">
            Credit limit
          </span>
          <input
            className={`${INPUT_CLASS} w-full text-right`}
            type="number"
            min="1"
            step="0.01"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            placeholder="0.00"
            aria-label="Credit limit"
            autoFocus
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] uppercase tracking-wide text-text-3">
            Repayment term (days)
          </span>
          <input
            className={`${INPUT_CLASS} w-full text-right`}
            type="number"
            min="1"
            max="365"
            step="1"
            value={creditTermDays}
            onChange={(e) => setCreditTermDays(e.target.value)}
            placeholder="30"
            aria-label="Repayment term in days"
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-[11px] uppercase tracking-wide text-text-3">
          Approval note (optional)
        </span>
        <textarea
          className={`${FIELD_SHELL} ${FIELD_BORDER} w-full px-3 py-2 resize-none`}
          value={approvalNote}
          onChange={(e) => setApprovalNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Visible on the account record…"
        />
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={approve.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {approve.isPending ? 'Approving…' : 'Approve account'}
        </Button>
      </div>
    </form>
  );
}
