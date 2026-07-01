import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { ICreditAccountRow } from '@/types';
import { useRejectCreditAccount } from '../hooks/useRejectCreditAccount';

interface RejectCreditAccountModalProps {
  account: ICreditAccountRow | null;
  onClose: () => void;
}

/** Outer wrapper — mounts a fresh form per open so the reason never carries over. */
export function RejectCreditAccountModal({
  account,
  onClose,
}: RejectCreditAccountModalProps) {
  return (
    <Modal
      isOpen={account !== null}
      onClose={onClose}
      title={account ? `Reject ${account.holderName}` : 'Reject credit account'}
      maxWidth="md"
      closeOnBackdrop={false}
    >
      {account ? <RejectForm account={account} onClose={onClose} /> : null}
    </Modal>
  );
}

function RejectForm({
  account,
  onClose,
}: {
  account: ICreditAccountRow;
  onClose: () => void;
}) {
  const reject = useRejectCreditAccount();
  const [reason, setReason] = useState('');

  const canSubmit = reason.trim().length >= 3 && !reject.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await reject.mutateAsync({
        id: account.id,
        payload: { rejectionReason: reason.trim() },
      });
      toast.success(`${account.holderName}'s request was rejected`);
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        toast.error(data?.message ?? 'Could not reject the request');
      } else {
        toast.error('Could not reject the request');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-[11px] uppercase tracking-wide text-text-3">
          Reason for rejection
        </span>
        <textarea
          className={`${FIELD_SHELL} ${FIELD_BORDER} w-full px-3 py-2 resize-none`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Shared with the cashier who submitted the request…"
          autoFocus
        />
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={reject.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" variant="danger" disabled={!canSubmit}>
          {reject.isPending ? 'Rejecting…' : 'Reject request'}
        </Button>
      </div>
    </form>
  );
}
