import {
    formatCellAsString,
    formatDate,
    fullTimestamp,
    getPath,
    todayStamp,
    toNumber,
} from './helpers';
import type { ExportColumn, ExportMetadata } from './types';

export async function exportExcel<T>(
    rows: T[],
    columns: ExportColumn<T>[],
    meta: ExportMetadata,
): Promise<void> {
    const XLSX = await import('xlsx');
    const generatedAt = meta.generatedAt ?? new Date();

    const sheetData: (string | number | null)[][] = [];

    sheetData.push([meta.title]);
    if (meta.companyName) sheetData.push([meta.companyName]);
    if (meta.subtitle) sheetData.push([meta.subtitle]);
    sheetData.push([`Generated: ${fullTimestamp(generatedAt)}`]);
    if (meta.generatedBy) sheetData.push([`By: ${meta.generatedBy}`]);
    sheetData.push([]);

    if (meta.summary && meta.summary.length > 0) {
        sheetData.push(meta.summary.map((s) => s.label));
        sheetData.push(meta.summary.map((s) => s.value));
        sheetData.push([]);
    }

    const headerRowIdx = sheetData.length;
    sheetData.push(columns.map((c) => c.header));

    rows.forEach((row) => {
        sheetData.push(
            columns.map((c) => {
                const raw = getPath(row, c.key);
                if (raw == null || raw === '') return '';
                if (c.format === 'currency') return toNumber(raw);
                if (c.format === 'date') return formatDate(raw);
                if (typeof raw === 'number') return raw;
                return String(raw);
            }),
        );
    });

    const hasFooter = columns.some((c) => c.footer);
    if (hasFooter) {
        sheetData.push(
            columns.map((c) => {
                if (!c.footer) return '';
                if (c.footer === 'sum') {
                    return rows.reduce(
                        (acc, row) => acc + toNumber(getPath(row, c.key)),
                        0,
                    );
                }
                return c.footer;
            }),
        );
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] =
        [];
    const lastCol = Math.max(0, columns.length - 1);
    for (let r = 0; r < headerRowIdx; r++) {
        const cell = sheetData[r];
        if (cell && cell.length === 1 && lastCol > 0) {
            merges.push({ s: { r, c: 0 }, e: { r, c: lastCol } });
        }
    }
    if (merges.length > 0) worksheet['!merges'] = merges;

    columns.forEach((c, colIdx) => {
        if (c.format === 'currency') {
            for (let r = headerRowIdx + 1; r <= headerRowIdx + rows.length; r++) {
                const ref = XLSX.utils.encode_cell({ r, c: colIdx });
                const cell = (worksheet as Record<string, unknown>)[ref] as
                    | { t?: string; v?: unknown; z?: string }
                    | undefined;
                if (cell && typeof cell.v === 'number') {
                    cell.t = 'n';
                    cell.z = '#,##0.00';
                }
            }
            if (hasFooter) {
                const footRef = XLSX.utils.encode_cell({
                    r: headerRowIdx + rows.length + 1,
                    c: colIdx,
                });
                const footCell = (worksheet as Record<string, unknown>)[
                    footRef
                ] as { t?: string; v?: unknown; z?: string } | undefined;
                if (footCell && typeof footCell.v === 'number') {
                    footCell.t = 'n';
                    footCell.z = '#,##0.00';
                }
            }
        }
    });

    worksheet['!cols'] = columns.map((c) => {
        const headerLen = c.header.length;
        const longestRow = rows.reduce((max, row) => {
            const v = formatCellAsString(row, c);
            return Math.max(max, v.length);
        }, headerLen);
        return { wch: Math.min(40, Math.max(10, longestRow + 2)) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${meta.filenameBase}-${todayStamp()}.xlsx`);
}
