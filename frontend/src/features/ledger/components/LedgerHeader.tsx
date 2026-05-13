import ExportMenu from '@/components/common/ExportMenu';
import type { ExportFormat } from '@/lib/exportUtils';
import type { ILedgerSummary } from '@/types';

interface LedgerHeaderProps {
    periodLabel: string;
    summary: ILedgerSummary | null;
    total: number;
    isExporting: boolean;
    onExport: (format: ExportFormat) => void | Promise<void>;
}

export function LedgerHeader({
    periodLabel,
    summary,
    total,
    isExporting,
    onExport,
}: LedgerHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    General ledger
                </h1>
                <p className="text-xs text-text-2 mt-1">
                    Period:{' '}
                    <span className="text-text-1 font-medium">
                        {periodLabel}
                    </span>
                    {summary && (
                        <>
                            {' '}·{' '}
                            <span className="mono">{summary.entryCount}</span>{' '}
                            entries
                        </>
                    )}
                </p>
            </div>
            <ExportMenu
                onExport={onExport}
                disabled={total === 0}
                isPreparing={isExporting}
            />
        </div>
    );
}
