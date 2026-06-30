import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Pill from '@/components/ui/Pill';
import { DataTable, EmptyState, FIELD_SHELL, FIELD_BORDER, type DataTableColumn } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useConfirm } from '@/hooks/useConfirm';
import type {
  CreditAccountPaymentMethod,
  ICreditAccountOutstandingSale,
  ICreditAccountTransactionRow,
} from '@/types';
import { CreditAccountStatusPill } from './CreditAccountStatusPill';
import { useCreditAccountStatement } from '../hooks/useCreditAccountStatement';
import { useReceiveCreditAccountPayment } from '../hooks/useReceiveCreditAccountPayment';
import { useUpdateCreditAccount } from '../hooks/useUpdateCreditAccount';
import { useSuspendCreditAccount } from '../hooks/useSuspendCreditAccount';
import { useCloseCreditAccount } from '../hooks/useCloseCreditAccount';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const LEDGER_COLUMNS: DataTableColumn<ICreditAccountTransactionRow>[] = [
  {
    key: 'date',
    header: 'Date',
    className: 'text-[12px] text-text-2 whitespace-nowrap',
    render: (t) => new Date(t.createdAt).toLocaleString(),
  },
  {
    key: 'ref',
    header: 'Ref',
    className: 'text-[12px] text-text-2 mono',
    render: (t) => t.referenceNo,
  },
  {
    key: 'type',
    header: 'Type',
    render: (t) => (
      <Pill tone={t.transactionType === 'Credit_Taken' ? 'warning' : 'success'}>
        {t.transactionType === 'Credit_Taken' ? 'Taken' : 'Paid'}
      </Pill>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    numeric: true,
    className: 'text-text-1',
    render: (t) => formatCurrency(Number(t.amount)),
  },
  {
    key: 'balance',
    header: 'Balance',
    align: 'right',
    numeric: true,
    className: 'text-text-2',
    render: (t) => formatCurrency(Number(t.runningBalance)),
  },
];

const OUTSTANDING_COLUMNS: DataTableColumn<ICreditAccountOutstandingSale>[] = [
  {
    key: 'invoice',
    header: 'Invoice',
    className: 'text-[12px] mono',
    render: (s) => s.invoiceNumber,
  },
  {
    key: 'due',
    header: 'Due',
    className: 'text-[12px] text-text-2 whitespace-nowrap',
    render: (s) => (s.dueDate ? formatDate(s.dueDate) : '—'),
  },
  {
    key: 'status',
    header: 'Status',
    render: (s) =>
      s.isOverdue ? (
        <Pill tone="danger">{s.overdueDays}d overdue</Pill>
      ) : (
        <Pill tone="neutral">On time</Pill>
      ),
  },
  {
    key: 'balance',
    header: 'Balance due',
    align: 'right',
    numeric: true,
    className: 'font-semibold',
    render: (s) => formatCurrency(Number(s.balanceDue)),
  },
];

interface CreditAccountStatementModalProps {
  accountId: string | null;
  onClose: () => void;
}

/**
 * Per-account statement: balance + ageing summary, a repayment form (FIFO
 * settles the oldest-due bills server-side), credit-limit/term edits, and the
 * suspend/close lifecycle actions, plus the full ledger and unpaid bills.
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
  const canRepay =
    statement != null &&
    statement.currentBalance > 0 &&
    (isActive || isSuspended);

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
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap items-center gap-2.5">
            <CreditAccountStatusPill status={statement.status} />
            <Pill tone={statement.currentBalance > 0 ? 'danger' : 'success'}>
              Balance {formatCurrency(statement.currentBalance)}
            </Pill>
            <Pill tone="neutral">
              Limit{' '}
              {statement.creditLimit === null
                ? 'unlimited'
                : formatCurrency(statement.creditLimit)}
            </Pill>
            <Pill tone="neutral">
              Available{' '}
              {statement.availableCredit === null
                ? '∞'
                : formatCurrency(statement.availableCredit)}
            </Pill>
            {statement.ageing.overdueTotal > 0 && (
              <Pill tone="danger">
                Overdue {formatCurrency(statement.ageing.overdueTotal)}
              </Pill>
            )}
            <span className="text-xs text-text-3">
              {statement.accountNo} · {statement.phone}
              {statement.creditTermDays != null &&
                ` · ${statement.creditTermDays}-day term`}
            </span>
          </div>

          {/* Receive payment */}
          {canRepay && (
            <form
              onSubmit={handleReceive}
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
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  aria-label="Payment amount"
                />
              </label>
              <select
                className={INPUT_CLASS}
                value={method}
                onChange={(e) =>
                  setMethod(e.target.value as CreditAccountPaymentMethod)
                }
                aria-label="Payment method"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank">Bank transfer</option>
              </select>
              <input
                className={`${INPUT_CLASS} flex-1 min-w-[8rem]`}
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                maxLength={255}
                aria-label="Payment notes"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!canReceive}
              >
                {receivePayment.isPending ? 'Recording…' : 'Record'}
              </Button>
              <span className="text-[11px] text-text-3 basis-full">
                Oldest-due bills are settled first; any excess reduces the
                balance.
              </span>
            </form>
          )}

          {/* Limit / term + lifecycle actions */}
          {(isActive || isSuspended) && (
            <div className="flex flex-wrap items-end gap-2">
              {isActive && (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                      Credit limit
                    </span>
                    <input
                      className={`${INPUT_CLASS} w-32 text-right`}
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
                      className={`${INPUT_CLASS} w-24 text-right`}
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
          )}

          {/* Outstanding bills */}
          {statement.outstandingSales.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-[11px] uppercase tracking-wide text-text-3">
                Unpaid bills
              </h3>
              <DataTable
                columns={OUTSTANDING_COLUMNS}
                rows={statement.outstandingSales}
                getRowKey={(s) => s.saleId}
                zebra
                stickyHeader
                maxHeight="12rem"
              />
            </div>
          )}

          {/* Ledger */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] uppercase tracking-wide text-text-3">
              Ledger
            </h3>
            <DataTable
              columns={LEDGER_COLUMNS}
              rows={statement.transactions}
              getRowKey={(t) => t.id}
              zebra
              stickyHeader
              maxHeight="18rem"
              empty={<EmptyState title="No credit activity yet." />}
            />
          </div>
        </div>
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
