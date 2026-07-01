import Modal from '@/components/ui/Modal';
import Pill from '@/components/ui/Pill';
import { DataTable, EmptyState } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { useCreditStatement } from '../hooks/useCreditStatement';
import { STATEMENT_COLUMNS } from './customer-statement-columns';
import { CustomerStatementActions } from './CustomerStatementActions';

interface ICustomerStatementModalProps {
    userId: string | null;
    onClose: () => void;
}

/**
 * Customer credit statement: running ledger, receive-payment form
 * (FIFO settles oldest invoices server-side), and the credit-limit
 * control. The mirror of a supplier's bills-and-payments view.
 */
export function CustomerStatementModal({
    userId,
    onClose,
}: ICustomerStatementModalProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const statementQuery = useCreditStatement(userId);
    const statement = statementQuery.data;

    return (
        <Modal
            isOpen={userId !== null}
            onClose={onClose}
            title={
                statement
                    ? `${statement.firstName} ${statement.lastName} — statement`
                    : 'Customer statement'
            }
            maxWidth="lg"
        >
            {!statement ? (
                <p className="text-sm text-text-2">Loading…</p>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Pill
                            tone={
                                statement.currentBalance > 0
                                    ? 'danger'
                                    : 'success'
                            }
                        >
                            Balance {formatCurrency(statement.currentBalance)}
                        </Pill>
                        <Pill tone="neutral">
                            Limit{' '}
                            {statement.creditLimit === null
                                ? 'unlimited'
                                : formatCurrency(statement.creditLimit)}
                        </Pill>
                        {statement.phone && (
                            <span className="text-xs text-text-3">
                                {statement.phone}
                            </span>
                        )}
                    </div>

                    <CustomerStatementActions
                        userId={userId}
                        isAdmin={isAdmin}
                        creditLimit={statement.creditLimit}
                    />

                    <DataTable
                        columns={STATEMENT_COLUMNS}
                        rows={statement.transactions}
                        getRowKey={(t) => t.id}
                        zebra
                        stickyHeader
                        maxHeight="18rem"
                        empty={<EmptyState title="No credit activity yet." />}
                    />
                </div>
            )}
        </Modal>
    );
}
