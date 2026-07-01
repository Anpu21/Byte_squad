import { exportExcel } from './excel';
import { exportPdf } from './pdf';
import type { ExportColumn, ExportFormat, ExportMetadata } from './types';

export async function exportData<T>(
    format: ExportFormat,
    rows: T[],
    columns: ExportColumn<T>[],
    meta: ExportMetadata,
): Promise<void> {
    if (format === 'pdf') {
        await exportPdf(rows, columns, meta);
    } else {
        await exportExcel(rows, columns, meta);
    }
}
