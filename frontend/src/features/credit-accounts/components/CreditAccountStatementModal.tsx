import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useConfirm } from '@/hooks/useConfirm';
import {
  CreditAccountStatementView,
  STATEMENT_INPUT_CLASS,
} from './CreditAccountStatementView';
import { useCreditAccountStatement } from '../hooks/useCreditAccountStatement';
import { useReceiveCreditAccountPayment } from '../hooks/useReceiveCreditAccountPayment';
import { useUpdateCreditAccount } from '../hooks/useUpdateCreditAccount';
import { useSuspendCreditAccount } from '../hooks/useSuspendCreditAccount';
import { useCloseCreditAccount } from '../hooks/useCloseCreditAccount';

interface CreditAccountStatementModalProps {
  accountId: string | null;
  onClose: () => void;
}

/**
 * Per-account statement modal (manager/admin). Wraps the shared
 * `CreditAccountStatementView` (balance/ageing summary, FIFO repayment, unpaid
 * bills, ledger) and adds the manager-only credit-limit/term edits plus the
 * suspend/close lifecycle actions.
 */
export function CreditAccountStatementModal({
  accountId,
  onClose,
}: CreditAccountStatementModalProps) {
  const confirm = useConfirm();
  const statementQuery = useCreditAccountStatement(accountId);
  const receivePayment = useReceiveCreditAccountPayment();
  const updateAccount = useUpdateCreditAccount();
  const suspendAccount = useSuspendCreditAccount();
  const closeAccount = useCloseCreditAccount();

  const [limitDraft, setLimitDraft] = useState('');
  const [termDraft, setTermDraft] = useState('');

  const statement = statementQuery.data;

  async function handleSaveLimitTerm() {
    if (!accountId) return;
    const payload: { creditLimit?: number; creditTermDays?: number } = {};
    if (limitDraft !== '') payload.creditLimit = Number(limitDraft);
    if (termDraft !== '') payload.creditTermDays = Number(termDraft);
    if (payload.creditLimit === undefined && payload.creditTermDays === undefined)
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

  return (
    <Modal
      isOpen={accountId !== null}
      onClose={onClose}
      title={
        statement
          ? `${statement.holderName} — statement`
          : 'Credit account statement'
      }
      maxWidth="2xl"
    >
      {!statement ? (
        <p className="text-sm text-text-2">Loading…</p>
      ) : (
        <CreditAccountStatementView
          statement={statement}
          onRecordPayment={(payload) =>
            receivePayment.mutateAsync({ id: statement.id, payload })
          }
          isRecordingPayment={receivePayment.isPending}
          managerControls={
            isActive || isSuspended ? (
              <div className="flex flex-wrap items-end gap-2">
                {isActive && (
                  <>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Credit limit
                      </span>
                      <input
                        className={`${STATEMENT_INPUT_CLASS} w-32 text-right`}
                        type="number"
                        min="1"
                        step="0.01"
                        value={limitDraft}
                        onChange={(e) => setLimitDraft(e.target.value)}
                        placeholder={
                          statement.creditLimit === null
                            ? 'unlimited'
                            : String(statement.creditLimit)
                        }
                        aria-label="Credit limit"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Term (days)
                      </span>
                      <input
                        className={`${STATEMENT_INPUT_CLASS} w-24 text-right`}
                        type="number"
                        min="1"
                        max="365"
                        step="1"
                        value={termDraft}
                        onChange={(e) => setTermDraft(e.target.value)}
                        placeholder={
                          statement.creditTermDays === null
                            ? '—'
                            : String(statement.creditTermDays)
                        }
                        aria-label="Repayment term in days"
                      />
                    </label>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        updateAccount.isPending ||
                        (limitDraft === '' && termDraft === '')
                      }
                      onClick={() => void handleSaveLimitTerm()}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={suspendAccount.isPending}
                      onClick={() => void handleSuspend()}
                    >
                      Suspend
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger"
                  disabled={closeAccount.isPending}
                  onClick={() => void handleClose()}
                >
                  Close account
                </Button>
              </div>
            ) : null
          }
        />
      )}
    </Modal>
  );
}

function extractError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}
