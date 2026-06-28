import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import type { ICreditAccountSearchResult } from '@/types';
import { useAuthorizeCreditOverride } from '@/features/credit-accounts/hooks/useAuthorizeCreditOverride';
import { extractCreditError } from './pos-credit-card.helpers';

interface IPosManagerOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: ICreditAccountSearchResult;
  amount: number;
  /** Receives the minted token + the amount it authorizes. */
  onAuthorized: (token: string, amount: number) => void;
}

/**
 * Counter step-up: a manager authorizes an over-limit credit charge by entering
 * their own credentials. The backend validates them against a MANAGER/ADMIN of
 * the account's branch and returns a short-lived token the checkout passes back.
 */
export function PosManagerOverrideModal({
  isOpen,
  onClose,
  account,
  amount,
  onAuthorized,
}: IPosManagerOverrideModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manager authorization"
      maxWidth="sm"
      closeOnBackdrop={false}
    >
      {isOpen ? (
        <OverrideForm
          account={account}
          amount={amount}
          onAuthorized={onAuthorized}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

function OverrideForm({
  account,
  amount,
  onAuthorized,
  onClose,
}: {
  account: ICreditAccountSearchResult;
  amount: number;
  onAuthorized: (token: string, amount: number) => void;
  onClose: () => void;
}) {
  const authorize = useAuthorizeCreditOverride();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const shortfall =
    account.availableCredit === null
      ? 0
      : Math.max(0, amount - account.availableCredit);
  const canSubmit =
    email.trim().length > 0 && password.length > 0 && !authorize.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      const result = await authorize.mutateAsync({
        email: email.trim(),
        password,
        creditAccountId: account.id,
        amount,
      });
      toast.success(`Authorized by ${result.authorizedBy}`);
      onAuthorized(result.token, amount);
      onClose();
    } catch {
      // Inline error renders below from the mutation state.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border border-border bg-surface-2/40 p-3 text-[13px] text-text-2">
        <p>
          <span className="font-medium text-text-1">{account.holderName}</span>{' '}
          is over their available credit on this{' '}
          <span className="font-medium text-text-1">
            {formatCurrency(amount)}
          </span>{' '}
          sale
          {shortfall > 0 ? (
            <>
              {' '}
              (short by{' '}
              <span className="font-medium text-danger">
                {formatCurrency(shortfall)}
              </span>
              )
            </>
          ) : null}
          . A manager must authorize the charge.
        </p>
      </div>
      <Input
        type="email"
        label="Manager email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="manager@store.com"
        autoComplete="off"
        autoFocus
      />
      <Input
        type="password"
        label="Manager password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="off"
      />
      {extractCreditError(authorize.error) ? (
        <p role="alert" className="text-[11px] text-danger font-medium">
          {extractCreditError(authorize.error)}
        </p>
      ) : null}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={authorize.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {authorize.isPending ? 'Authorizing…' : 'Authorize charge'}
        </Button>
      </div>
    </form>
  );
}
