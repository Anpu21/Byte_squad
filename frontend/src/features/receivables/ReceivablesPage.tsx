import { useState } from 'react';
import Card from '@/components/ui/Card';
import { useReceivables } from '@/features/receivables/hooks/useReceivables';
import { ReceivablesTable } from '@/features/receivables/components/ReceivablesTable';
import { CustomerStatementModal } from '@/features/receivables/components/CustomerStatementModal';

/**
 * Customer receivables (AR) — who owes what, aged by sale date, with
 * statements, repayments (FIFO against oldest invoices), and credit
 * limits. Admin/manager only.
 */
export function ReceivablesPage() {
    const receivablesQuery = useReceivables();
    const [statementUserId, setStatementUserId] = useState<string | null>(
        null,
    );

    return (
        <div>
            <Card className="overflow-hidden">
                <ReceivablesTable
                    rows={receivablesQuery.data ?? []}
                    isLoading={receivablesQuery.isLoading}
                    onOpenStatement={(row) => setStatementUserId(row.userId)}
                />
            </Card>
            <CustomerStatementModal
                userId={statementUserId}
                onClose={() => setStatementUserId(null)}
            />
        </div>
    );
}
