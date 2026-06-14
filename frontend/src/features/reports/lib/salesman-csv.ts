import type { ISalesmanReportRow } from '@/types';

/**
 * Build the CSV text for the salesman report (pure — the download
 * wrapper below owns the DOM side). Names are quoted so commas in
 * display names cannot shift columns.
 */
export function buildSalesmanCsv(rows: ISalesmanReportRow[]): string {
    const header = [
        'Cashier',
        'Sales',
        'Gross',
        'Bill discount',
        'Net',
        'Voided',
    ];
    const lines = [header.join(',')].concat(
        rows.map((row) =>
            [
                `"${row.cashierName.replace(/"/g, '""')}"`,
                row.salesCount,
                row.grossTotal.toFixed(2),
                row.discountTotal.toFixed(2),
                row.netTotal.toFixed(2),
                row.voidedCount,
            ].join(','),
        ),
    );
    return lines.join('\n');
}

/** Trigger a browser download of the report as a CSV file. */
export function downloadSalesmanCsv(
    rows: ISalesmanReportRow[],
    startDate: string,
    endDate: string,
): void {
    const blob = new Blob([buildSalesmanCsv(rows)], {
        type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salesman-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
