import type { ExportColumn, ExportMetadata } from '@/lib/exportUtils';
import type { LeaderboardRow } from '../hooks/useBranchComparisonPage';
import { formatCurrencyWhole, formatDateRange } from './format';

export interface ComparisonExportInput {
    rows: LeaderboardRow[];
    startDate: string;
    endDate: string;
    totals: { revenue: number; expenses: number; transactions: number };
}

export interface ComparisonExportPayload {
    rows: LeaderboardRow[];
    columns: ExportColumn<LeaderboardRow>[];
    meta: ExportMetadata;
}

export function buildComparisonExport(
    input: ComparisonExportInput,
): ComparisonExportPayload {
    const columns: ExportColumn<LeaderboardRow>[] = [
        { header: 'Rank', key: 'rank', align: 'right' },
        { header: 'Branch', key: 'entry.branchName' },
        {
            header: 'Revenue',
            key: 'entry.revenue',
            align: 'right',
            format: 'currency',
            footer: 'sum',
        },
        {
            header: 'Expenses',
            key: 'entry.expenses',
            align: 'right',
            format: 'currency',
            footer: 'sum',
        },
        {
            header: 'Margin',
            key: 'margin',
            align: 'right',
            format: 'currency',
            footer: 'sum',
        },
        {
            header: 'Transactions',
            key: 'entry.transactionCount',
            align: 'right',
            footer: 'sum',
        },
        {
            header: 'AOV',
            key: 'entry.avgTransactionValue',
            align: 'right',
            format: 'currency',
        },
        {
            header: 'Staff',
            key: 'entry.staffCount',
            align: 'right',
        },
        {
            header: 'Rev / Staff',
            key: 'entry.revenuePerStaff',
            align: 'right',
            format: 'currency',
        },
    ];

    const meta: ExportMetadata = {
        title: 'Branch Comparison',
        subtitle: formatDateRange(input.startDate, input.endDate),
        filenameBase: `branch-comparison-${input.startDate}_${input.endDate}`,
        summary: [
            { label: 'Branches', value: String(input.rows.length) },
            {
                label: 'Total revenue',
                value: formatCurrencyWhole(input.totals.revenue),
            },
            {
                label: 'Total expenses',
                value: formatCurrencyWhole(input.totals.expenses),
            },
            {
                label: 'Transactions',
                value: input.totals.transactions.toLocaleString(),
            },
        ],
    };

    return { rows: input.rows, columns, meta };
}
