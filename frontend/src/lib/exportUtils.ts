import { formatCurrency } from '@/lib/utils';

export type ExportFormat = 'pdf' | 'excel';

export interface ExportColumn<T> {
    header: string;
    key: keyof T | string;
    align?: 'left' | 'right' | 'center';
    format?: 'currency' | 'date' | 'text';
    footer?: 'sum' | string;
}

export interface ExportSummaryItem {
    label: string;
    value: string;
}

export interface ExportMetadata {
    title: string;
    subtitle?: string;
    filenameBase: string;
    companyName?: string;
    generatedBy?: string;
    generatedAt?: Date;
    summary?: ExportSummaryItem[];
}

function getPath<T>(row: T, key: keyof T | string): unknown {
    if (typeof key !== 'string' || !key.includes('.')) {
        return (row as Record<string, unknown>)[key as string];
    }
    return key
        .split('.')
        .reduce<unknown>(
            (acc, part) =>
                acc == null
                    ? acc
                    : (acc as Record<string, unknown>)[part],
            row,
        );
}

function toNumber(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

function formatDate(value: unknown): string {
    if (value == null || value === '') return '';
    const d = new Date(value as string | number | Date);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatCellAsString<T>(row: T, col: ExportColumn<T>): string {
    const raw = getPath(row, col.key);
    if (raw == null || raw === '') return '';
    if (col.format === 'currency') return formatCurrency(toNumber(raw));
    if (col.format === 'date') return formatDate(raw);
    return String(raw);
}

function todayStamp(): string {
    return new Date().toISOString().split('T')[0];
}

function fullTimestamp(d: Date): string {
    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

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

async function exportPdf<T>(
    rows: T[],
    columns: ExportColumn<T>[],
    meta: ExportMetadata,
): Promise<void> {
    const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
    ]);
    const autoTable = (autoTableModule.default ??
        autoTableModule) as unknown as (
        doc: InstanceType<typeof jsPDF>,
        options: Record<string, unknown>,
    ) => void;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const generatedAt = meta.generatedAt ?? new Date();

    let cursorY = margin;

    if (meta.companyName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text(meta.companyName, margin, cursorY);
        cursorY += 14;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20);
    doc.text(meta.title, margin, cursorY);
    cursorY += 22;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90);
    if (meta.subtitle) {
        doc.text(meta.subtitle, margin, cursorY);
        cursorY += 14;
    }
    doc.text(`Generated: ${fullTimestamp(generatedAt)}`, margin, cursorY);
    if (meta.generatedBy) {
        const generatedByText = `By: ${meta.generatedBy}`;
        const textWidth = doc.getTextWidth(generatedByText);
        doc.text(generatedByText, pageWidth - margin - textWidth, cursorY);
    }
    cursorY += 16;

    if (meta.summary && meta.summary.length > 0) {
        const boxGap = 12;
        const boxWidth =
            (pageWidth - margin * 2 - boxGap * (meta.summary.length - 1)) /
            meta.summary.length;
        const boxHeight = 50;
        meta.summary.forEach((item, idx) => {
            const x = margin + idx * (boxWidth + boxGap);
            doc.setDrawColor(220);
            doc.setFillColor(248, 248, 250);
            doc.roundedRect(x, cursorY, boxWidth, boxHeight, 4, 4, 'FD');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(120);
            doc.text(item.label.toUpperCase(), x + 10, cursorY + 16);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(20);
            doc.text(item.value, x + 10, cursorY + 36);
        });
        cursorY += boxHeight + 16;
    }

    const head = [columns.map((c) => c.header)];
    const body = rows.map((row) =>
        columns.map((c) => formatCellAsString(row, c)),
    );

    const hasFooter = columns.some((c) => c.footer);
    let foot: string[][] | undefined;
    if (hasFooter) {
        foot = [
            columns.map((c) => {
                if (!c.footer) return '';
                if (c.footer === 'sum') {
                    const total = rows.reduce(
                        (acc, row) => acc + toNumber(getPath(row, c.key)),
                        0,
                    );
                    return c.format === 'currency'
                        ? formatCurrency(total)
                        : String(total);
                }
                return c.footer;
            }),
        ];
    }

    const columnStyles: Record<number, { halign?: 'left' | 'right' | 'center' }> =
        {};
    columns.forEach((c, idx) => {
        if (c.align) columnStyles[idx] = { halign: c.align };
    });

    autoTable(doc, {
        head,
        body,
        foot,
        startY: cursorY,
        margin: { left: margin, right: margin, bottom: margin },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 6, textColor: 30 },
        headStyles: {
            fillColor: [30, 30, 30],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'left',
        },
        footStyles: {
            fillColor: [240, 240, 244],
            textColor: 20,
            fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [250, 250, 252] },
        columnStyles,
        didDrawPage: () => {
            const pageCount = doc.getNumberOfPages();
            const pageNum = doc.getCurrentPageInfo().pageNumber;
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(140);
            doc.text(
                `Page ${pageNum} of ${pageCount}`,
                pageWidth - margin,
                pageHeight - 16,
                { align: 'right' },
            );
        },
    });

    doc.save(`${meta.filenameBase}-${todayStamp()}.pdf`);
}

async function exportExcel<T>(
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
