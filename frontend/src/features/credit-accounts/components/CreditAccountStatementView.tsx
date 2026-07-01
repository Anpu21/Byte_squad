import { useState, type ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import { DataTable, EmptyState } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type {
  CreditAccountPaymentMethod,
  ICreditAccountStatement,
  IReceiveCreditAccountPaymentPayload,
} from '@/types';
import { CreditAccountStatusPill } from './CreditAccountStatusPill';
import {
  LEDGER_COLUMNS,
  OUTSTANDING_COLUMNS,
} from './credit-account-statement-columns';

/** Shared input styling for the statement repayment + manager-control forms. */
export const STATEMENT_INPUT_CLASS =
  'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/25 transition-colors';

interface CreditAccountStatementViewProps {
  statement: ICreditAccountStatement;
  /**
   * Allow recording a FIFO repayment. The form is still only shown when the
   * account has an outstanding balance and is ACTIVE/SUSPENDED. Default `true`.
   */
  canRecordPayment?: boolean;
  /** Records a repayment and resolves with the refreshed statement. */
  onRecordPayment?: (
    payload: IReceiveCreditAccountPaymentPayload,
  ) => Promise<ICreditAccountStatement>;
  isRecordingPayment?: boolean;
  /** Manager-only controls (limit/term, suspend, close), rendered under the form. */
  managerControls?: ReactNode;
}

/**
 * Presentational credit-account statement: balance/limit/ageing summary, an
 * optional repayment form (FIFO settles oldest-due bills server-side), the
 * unpaid-bills and ledger tables, plus a slot for manager-only controls. Shared
 * by the manager statement modal and the cashier store-credit page.
 */
export function CreditAccountStatementView({
  statement,
  canRecordPayment = true,
  onRecordPayment,
  isRecordingPayment = false,
  managerControls,
}: CreditAccountStatementViewProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<CreditAccountPaymentMethod>('Cash');
  const [notes, setNotes] = useState('');

  const amountNum = Number(amount);
  const canSubmit =
    Number.isFinite(amountNum) && amountNum > 0 && !isRecordingPayment;

  const isActive = statement.status === 'ACTIVE';
  const isSuspended = statement.status === 'SUSPENDED';
  const showRepayment =
    canRecordPayment &&
    onRecordPayment != null &&
    statement.currentBalance > 0 &&
    (isActive || isSuspended);

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    if (!onRecordPayment || !canSubmit) return;
    try {
      const updated = await onRecordPayment({
        amount: amountNum,
        method,
        notes: notes.trim() || undefined,
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

  return (
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
      {showRepayment && (
        <form
          onSubmit={handleReceive}
          className="flex flex-wrap items-end gap-2 p-3 rounded-md border border-border bg-surface-2/40"
        >
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-wide text-text-3">
              Receive payment
            </span>
            <input
              className={`${STATEMENT_INPUT_CLASS} w-32 text-right`}
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
            className={STATEMENT_INPUT_CLASS}
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
            className={`${STATEMENT_INPUT_CLASS} flex-1 min-w-[8rem]`}
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            maxLength={255}
            aria-label="Payment notes"
          />
          <Button type="submit" variant="primary" size="sm" disabled={!canSubmit}>
            {isRecordingPayment ? 'Recording…' : 'Record'}
          </Button>
          <span className="text-[11px] text-text-3 basis-full">
            Oldest-due bills are settled first; any excess reduces the balance.
          </span>
        </form>
      )}

      {/* Manager-only controls (limit/term, suspend, close) */}
      {managerControls}

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
  );
}

function extractError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}
