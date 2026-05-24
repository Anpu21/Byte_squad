/**
 * Local stub of the dashboard transaction row shape.
 *
 * Phase 1 of the Shanel POS port deletes the global `ICashierTransactionRow`
 * type alongside the legacy `posService`. This local placeholder keeps the
 * transactions surface compiling until Phase 7 rebuilds the read layer.
 *
 * TODO Phase 7: replace with the new shared transaction-row type emitted by
 * the rebuilt POS read endpoints.
 */
export interface ITransactionRow {
    id: string;
    transactionNumber: string;
    createdAt: string;
    branchName?: string | null;
    cashierName: string;
    itemCount: number;
    total: number;
}

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
    rows: ITransactionRow[],
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
