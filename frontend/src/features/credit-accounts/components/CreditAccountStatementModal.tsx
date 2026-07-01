import Modal from '@/components/ui/Modal';
import Pill from '@/components/ui/Pill';
import { DataTable, EmptyState } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { CreditAccountStatusPill } from './CreditAccountStatusPill';
import {
  LEDGER_COLUMNS,
  OUTSTANDING_COLUMNS,
} from './credit-statement-columns';
import { CreditReceivePaymentForm } from './CreditReceivePaymentForm';
import { CreditAccountAdminActions } from './CreditAccountAdminActions';
import { useCreditStatementActions } from '../hooks/useCreditStatementActions';

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
  const s = useCreditStatementActions(accountId, onClose);
  const { statement } = s;

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

          {s.canRepay && (
            <CreditReceivePaymentForm
              amount={s.amount}
              onAmountChange={s.setAmount}
              method={s.method}
              onMethodChange={s.setMethod}
              notes={s.notes}
              onNotesChange={s.setNotes}
              canReceive={s.canReceive}
              isPending={s.receivePayment.isPending}
              onSubmit={s.handleReceive}
            />
          )}

          {(s.isActive || s.isSuspended) && (
            <CreditAccountAdminActions
              isActive={s.isActive}
              creditLimit={statement.creditLimit}
              creditTermDays={statement.creditTermDays}
              limitDraft={s.limitDraft}
              onLimitDraftChange={s.setLimitDraft}
              termDraft={s.termDraft}
              onTermDraftChange={s.setTermDraft}
              savePending={s.updateAccount.isPending}
              onSaveLimitTerm={() => void s.handleSaveLimitTerm()}
              suspendPending={s.suspendAccount.isPending}
              onSuspend={() => void s.handleSuspend()}
              closePending={s.closeAccount.isPending}
              onCloseAccount={() => void s.handleClose()}
            />
          )}

          {statement.outstandingSales.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-[11px] uppercase tracking-wide text-text-3">
                Unpaid bills
              </h3>
              <DataTable
                columns={OUTSTANDING_COLUMNS}
                rows={statement.outstandingSales}
                getRowKey={(sale) => sale.saleId}
                zebra
                stickyHeader
                maxHeight="12rem"
              />
            </div>
          )}

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
