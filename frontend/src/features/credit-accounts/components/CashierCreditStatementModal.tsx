import Modal from '@/components/ui/Modal';
import { useCreditAccountStatement } from '../hooks/useCreditAccountStatement';
import { useReceiveCreditAccountPayment } from '../hooks/useReceiveCreditAccountPayment';
import { CreditAccountStatementView } from './CreditAccountStatementView';

interface CashierCreditStatementModalProps {
  accountId: string | null;
  onClose: () => void;
}

/**
 * Cashier-facing statement modal opened from the store-credit browse table:
 * balance/ageing summary, unpaid bills, ledger, and a FIFO repayment form. It
 * deliberately omits the manager controls (limit/term edits, suspend, close)
 * that the admin `CreditAccountStatementModal` renders — a cashier can only
 * read the tab and take a repayment.
 */
export function CashierCreditStatementModal({
  accountId,
  onClose,
}: CashierCreditStatementModalProps) {
  const statement = useCreditAccountStatement(accountId);
  const receivePayment = useReceiveCreditAccountPayment();
  const stmt = statement.data;

  return (
    <Modal
      isOpen={accountId !== null}
      onClose={onClose}
      title={
        stmt ? `${stmt.holderName} — statement` : 'Credit account statement'
      }
      maxWidth="2xl"
    >
      {!stmt ? (
        <p className="text-sm text-text-2">Loading…</p>
      ) : (
        <CreditAccountStatementView
          statement={stmt}
          onRecordPayment={(payload) =>
            receivePayment.mutateAsync({ id: stmt.id, payload })
          }
          isRecordingPayment={receivePayment.isPending}
        />
      )}
    </Modal>
  );
}
