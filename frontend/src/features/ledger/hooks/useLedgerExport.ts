import { useState } from 'react';
import { accountingService } from '@/services/accounting.service';
import { formatCurrency } from '@/lib/utils';
import {
    exportData,
    type ExportColumn,
    type ExportFormat,
} from '@/lib/exportUtils';
import type { ILedgerSummary } from '@/types';
import { formatPeriodLabel } from '../lib/period';

const EXPORT_FETCH_LIMIT = 10000;

interface LedgerExportRow {
    date: string;
    description: string;
    referenceNumber: string;
    debit: number | null;
    credit: number | null;
}

interface UseLedgerExportArgs {
    entryType: string;
    startDate: string;
    endDate: string;
    debouncedSearch: string;
    summary: ILedgerSummary | undefined;
    user: { firstName: string; lastName: string } | null;
}

export function useLedgerExport({
    entryType,
    startDate,
    endDate,
    debouncedSearch,
    summary,
    user,
}: UseLedgerExportArgs) {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async (format: ExportFormat) => {
        try {
            setIsExporting(true);
            setError(null);
            const data = await accountingService.getLedgerEntries({
                entryType: entryType !== 'all' ? entryType : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                search: debouncedSearch || undefined,
                page: 1,
                limit: EXPORT_FETCH_LIMIT,
            });

            const rows: LedgerExportRow[] = (data.items ?? []).map((e) => ({
                date: e.createdAt,
                description: e.description,
                referenceNumber: e.referenceNumber,
                debit: e.entryType === 'debit' ? Number(e.amount) : null,
                credit: e.entryType === 'credit' ? Number(e.amount) : null,
            }));

            const columns: ExportColumn<LedgerExportRow>[] = [
                { header: 'Date', key: 'date', format: 'date' },
                { header: 'Description', key: 'description' },
                { header: 'Reference', key: 'referenceNumber' },
                { header: 'Debit', key: 'debit', align: 'right', format: 'currency', footer: 'sum' },
                { header: 'Credit', key: 'credit', align: 'right', format: 'currency', footer: 'sum' },
            ];

            const summaryItems = summary
                ? [
                      { label: 'Total Credits', value: formatCurrency(summary.totalCredits) },
                      { label: 'Total Debits', value: formatCurrency(summary.totalDebits) },
                      { label: 'Net Balance', value: formatCurrency(summary.netBalance) },
                      { label: 'Total Entries', value: String(summary.entryCount) },
                  ]
                : undefined;

            await exportData(format, rows, columns, {
                title: 'General Ledger',
                subtitle: formatPeriodLabel(startDate, endDate),
                filenameBase: 'ledger',
                companyName: 'LedgerPro',
                generatedBy: user
                    ? `${user.firstName} ${user.lastName}`
                    : undefined,
                summary: summaryItems,
            });
        } catch {
            setError('Failed to export ledger entries');
        } finally {
            setIsExporting(false);
        }
    };

    return { isExporting, exportError: error, handleExport };
}
