import { formatCurrency } from '@/lib/utils';

import {
    formatCellAsString,
    fullTimestamp,
    getPath,
    todayStamp,
    toNumber,
} from './helpers';
import type { ExportColumn, ExportMetadata } from './types';

export async function exportPdf<T>(
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
