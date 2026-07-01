import { LuDownload as Download } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useTransactionsPage } from '@/features/transactions/hooks/useTransactionsPage';
import { TransactionsKpis } from '@/features/transactions/components/TransactionsKpis';
import { TransactionsTable } from '@/features/transactions/components/TransactionsTable';
import { downloadTransactionsCsv } from '@/features/transactions/lib/format';

export function TransactionsPage() {
    const p = useTransactionsPage();

    if (p.isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const canExport = !!p.data && p.data.recentTransactions.length > 0;

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex items-start justify-between gap-3 mb-6">
                <p className="text-sm text-text-2">{p.subtitle}</p>
                <Button
                    variant="secondary"
                    onClick={() =>
                        p.data &&
                        downloadTransactionsCsv(
                            p.data.recentTransactions,
                            p.data.scope,
                        )
                    }
                    disabled={!canExport}
                >
                    <Download size={14} />
                    Export CSV
                </Button>
            </div>

            <TransactionsKpis data={p.data} />

            {p.data ? (
                <TransactionsTable
                    data={p.data}
                    showBranchCol={p.showBranchCol}
                    showCashierCol={p.showCashierCol}
                />
            ) : (
                <EmptyState title="No transactions yet" />
            )}
        </div>
    );
}
