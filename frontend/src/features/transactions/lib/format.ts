import type { ICashierTransactionRow } from '@/types';

export function formatRevenue(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function downloadTransactionsCsv(
    rows: ICashierTransactionRow[],
    scope: string,
): void {
    const header = [
        'Transaction #',
        'Date',
        'Branch',
        'Cashier',
        'Items',
        'Total',
    ];
    const lines = [header.join(',')].concat(
        rows.map((t) =>
            [
                t.transactionNumber,
                new Date(t.createdAt).toISOString(),
                t.branchName ?? '',
                t.cashierName,
                String(t.itemCount),
                String(t.total),
            ]
                .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                .join(','),
        ),
    );
    const blob = new Blob([lines.join('\n')], {
        type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
