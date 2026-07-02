import Button from '@/components/ui/Button';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { CreditAccountPaymentMethod } from '@/types';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface CreditReceivePaymentFormProps {
  amount: string;
  onAmountChange: (value: string) => void;
  method: CreditAccountPaymentMethod;
  onMethodChange: (value: CreditAccountPaymentMethod) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  canReceive: boolean;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

/** Repayment entry — FIFO settles the oldest-due bills server-side. */
export function CreditReceivePaymentForm({
  amount,
  onAmountChange,
  method,
  onMethodChange,
  notes,
  onNotesChange,
  canReceive,
  isPending,
  onSubmit,
}: CreditReceivePaymentFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-2 p-3 rounded-md border border-border bg-surface-2/40"
    >
      <label className="block space-y-1.5">
        <span className="text-[11px] uppercase tracking-wide text-text-3">
          Receive payment
        </span>
        <input
          className={`${INPUT_CLASS} w-32 text-right`}
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.00"
          aria-label="Payment amount"
        />
      </label>
      <select
        className={`${INPUT_CLASS} field-select`}
        value={method}
        onChange={(e) =>
          onMethodChange(e.target.value as CreditAccountPaymentMethod)
        }
        aria-label="Payment method"
      >
        <option value="Cash">Cash</option>
        <option value="Card">Card</option>
      </select>
      <input
        className={`${INPUT_CLASS} flex-1 min-w-[8rem]`}
        type="text"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Notes (optional)"
        maxLength={255}
        aria-label="Payment notes"
      />
      <Button type="submit" variant="primary" size="sm" disabled={!canReceive}>
        {isPending ? 'Recording…' : 'Record'}
      </Button>
      <span className="text-[11px] text-text-3 basis-full">
        Oldest-due bills are settled first; any excess reduces the balance.
      </span>
    </form>
  );
}
