import { useState, type FormEvent } from 'react';
import { LuSend as Send } from 'react-icons/lu';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button, Input, Modal } from '@/components/ui';
import { useCreateCreditAccountRequest } from '../hooks/useCreateCreditAccountRequest';

interface CashierCreditEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fired after a request is submitted, so the page can refresh its search. */
  onEnrolled?: () => void;
}

/** Strip display formatting from a typed phone string (digits + leading `+`). */
const sanitisePhone = (raw: string): string => raw.replace(/[^\d+]/g, '');

/**
 * Cashier "special form" for a walk-in who isn't yet a credit customer. Submits
 * a PENDING request for a manager to approve — it does NOT attach or charge; the
 * customer can only buy on credit once a manager sets their limit + term.
 */
export function CashierCreditEnrollModal({
  isOpen,
  onClose,
  onEnrolled,
}: CashierCreditEnrollModalProps) {
  const enroll = useCreateCreditAccountRequest();
  const [holderName, setHolderName] = useState('');
  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [requestedLimit, setRequestedLimit] = useState('');

  const cleanPhone = sanitisePhone(phone);
  const canSubmit =
    holderName.trim().length >= 2 && cleanPhone.length >= 7 && !enroll.isPending;

  function reset() {
    setHolderName('');
    setPhone('');
    setNic('');
    setRequestedLimit('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await enroll.mutateAsync({
        holderName: holderName.trim(),
        phone: cleanPhone,
        nic: nic.trim() || undefined,
        requestedCreditLimit: requestedLimit ? Number(requestedLimit) : undefined,
      });
      toast.success('Credit request sent to the manager for approval');
      reset();
      onEnrolled?.();
      onClose();
    } catch (err: unknown) {
      toast.error(extractError(err, 'Could not send the credit request'));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll a store-credit customer"
      maxWidth="md"
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit}
        aria-label="Enroll customer for store credit"
      >
        <p className="text-[12px] text-text-2">
          Capture the walk-in's details. A manager reviews the request and sets
          the credit limit and repayment term before the customer can buy on
          credit.
        </p>
        <Input
          label="Customer name"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          placeholder="Required"
          aria-required
          autoFocus
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="tel"
            inputMode="tel"
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Required"
            aria-required
          />
          <Input
            label="NIC"
            value={nic}
            onChange={(e) => setNic(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <Input
          type="number"
          min="0"
          step="0.01"
          label="Suggested limit"
          value={requestedLimit}
          onChange={(e) => setRequestedLimit(e.target.value)}
          placeholder="Optional — the manager decides the final limit"
        />
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit}>
            <Send size={14} aria-hidden />
            {enroll.isPending ? 'Sending…' : 'Send request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function extractError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string | string[] }
      | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
