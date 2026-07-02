import { useState, type FormEvent } from 'react';
import { LuSend as Send } from 'react-icons/lu';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { usePosCreditEnroll } from '@/features/pos/hooks/usePosCreditEnroll';
import { extractCreditError } from './pos-credit-card.helpers';
import {
  isValidSriLankaPhone,
  normalizeSriLankaPhone,
  SRI_LANKA_PHONE_ERROR,
} from '@/lib/phone';

export interface IPosCreditEnrollFormProps {
  defaultHolderName: string;
  defaultPhone: string;
  /** Called after a request is submitted so the card can reset its search. */
  onEnrolled: () => void;
}

/**
 * The cashier "special form" — mounted inside the credit card when a search
 * misses. Captures the walk-in's details and submits a PENDING credit request
 * for a manager to approve. It does NOT attach the account: the customer can
 * only buy on credit once a manager sets their limit + term.
 */
export function PosCreditEnrollForm({
  defaultHolderName,
  defaultPhone,
  onEnrolled,
}: IPosCreditEnrollFormProps) {
  const enroll = usePosCreditEnroll();
  const [holderName, setHolderName] = useState(defaultHolderName);
  const [phone, setPhone] = useState(defaultPhone);
  const [nic, setNic] = useState('');
  const [requestedLimit, setRequestedLimit] = useState('');

  const phoneValid = isValidSriLankaPhone(phone);
  const showPhoneError = phone.trim().length > 0 && !phoneValid;
  const canSubmit =
    holderName.trim().length >= 2 && phoneValid && !enroll.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = normalizeSriLankaPhone(phone);
    if (!canSubmit || !normalizedPhone) return;
    try {
      await enroll.mutateAsync({
        holderName: holderName.trim(),
        phone: normalizedPhone,
        nic: nic.trim() || undefined,
        requestedCreditLimit: requestedLimit
          ? Number(requestedLimit)
          : undefined,
      });
      toast.success('Credit request sent to the manager for approval');
      onEnrolled();
    } catch {
      // Inline error renders below from the mutation state.
    }
  };

  return (
    <form
      className="flex flex-col gap-3 border-t border-border pt-3"
      onSubmit={handleSubmit}
      aria-label="Enroll customer for store credit"
    >
      <p className="text-[11px] text-text-2">
        Sends a request to the manager, who approves the credit limit and term
        before this customer can buy on credit.
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
      {showPhoneError ? (
        <p className="text-[11px] text-text-3">{SRI_LANKA_PHONE_ERROR}</p>
      ) : null}
      <Input
        type="number"
        min="0"
        step="0.01"
        label="Suggested limit"
        value={requestedLimit}
        onChange={(e) => setRequestedLimit(e.target.value)}
        placeholder="Optional — the manager decides the final limit"
      />
      {extractCreditError(enroll.error) ? (
        <p role="alert" className="text-[11px] text-danger font-medium">
          {extractCreditError(enroll.error)}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={!canSubmit}
        size="sm"
        className="self-start"
      >
        <Send size={14} aria-hidden />
        {enroll.isPending ? 'Sending…' : 'Send request'}
      </Button>
    </form>
  );
}
