import { jsPDF } from 'jspdf';
import { formatCurrency } from '@/lib/utils';
import type { ISale, ISaleItem } from '@/types';

const PAGE_WIDTH_MM = 80;
const MARGIN_MM = 5;
const CONTENT_WIDTH = PAGE_WIDTH_MM - MARGIN_MM * 2;
const LEFT_X = MARGIN_MM;
const RIGHT_X = PAGE_WIDTH_MM - MARGIN_MM;
const CENTER_X = PAGE_WIDTH_MM / 2;
const LINE = 4;

export interface IReceiptBusiness {
    name?: string;
    address?: string;
}

/**
 * Render a sale into an 80mm-wide PDF receipt and return it as base64 (no
 * data-URI prefix), ready to POST for emailing. Mirrors the on-screen
 * `PosBillTemplate` content: header, invoice/date, customer, item lines,
 * totals, optional loyalty, footer. Uses the built-in Courier font so no
 * font assets are needed (works in node/jsdom for tests too).
 */
export function buildReceiptPdf(
    sale: ISale,
    business: IReceiptBusiness = {},
): string {
    const items = sale.items ?? [];
    const estimatedHeight = 60 + items.length * 8 + (sale.loyalty ? 18 : 0);
    const doc = new jsPDF({
        unit: 'mm',
        format: [PAGE_WIDTH_MM, Math.max(estimatedHeight, 90)],
    });
    doc.setFont('courier', 'normal');

    let y = 8;

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text(business.name ?? 'LedgerPro', CENTER_X, y, { align: 'center' });
    y += 5;
    if (business.address) {
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.text(business.address, CENTER_X, y, {
            align: 'center',
            maxWidth: CONTENT_WIDTH,
        });
        y += 4;
    }
    y = divider(doc, y);

    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(sale.invoiceNumber, CENTER_X, y, { align: 'center' });
    y += 4;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(formatDateTime(sale.createdAt), CENTER_X, y, { align: 'center' });
    y += 2;
    y = divider(doc, y);

    doc.text(customerLine(sale), LEFT_X, y);
    y += 1;
    y = divider(doc, y);

    for (const item of items) {
        doc.text(truncate(item.product?.name ?? 'Item', 34), LEFT_X, y);
        y += 3.5;
        const qty = `${formatQty(item)} x ${formatCurrency(Number(item.unitPrice))}`;
        doc.text(qty, LEFT_X + 2, y);
        doc.text(formatCurrency(Number(item.lineTotal)), RIGHT_X, y, {
            align: 'right',
        });
        y += LINE;
    }
    y = divider(doc, y);

    y = row(doc, y, 'Subtotal', formatCurrency(Number(sale.subtotal)));
    if (Number(sale.discountAmount) > 0) {
        y = row(doc, y, 'Discount', `-${formatCurrency(Number(sale.discountAmount))}`);
    }
    if (Number(sale.taxAmount) > 0) {
        y = row(doc, y, 'Tax', formatCurrency(Number(sale.taxAmount)));
    }
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    y = row(doc, y, 'TOTAL', formatCurrency(Number(sale.total)));
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);

    if (sale.loyalty) {
        y = divider(doc, y);
        if (sale.loyalty.earned) {
            y = row(doc, y, 'Points earned', String(sale.loyalty.earned));
        }
        if (sale.loyalty.redeemed) {
            y = row(doc, y, 'Points redeemed', String(sale.loyalty.redeemed));
        }
        y = row(doc, y, 'Points balance', String(sale.loyalty.newBalance));
    }

    y = divider(doc, y);
    doc.setFont('courier', 'bold');
    doc.text('Thank you for shopping!', CENTER_X, y + 1, { align: 'center' });

    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1] ?? '';
}

function divider(doc: jsPDF, y: number): number {
    doc.setLineDashPattern([0.5, 0.5], 0);
    doc.setLineWidth(0.1);
    doc.line(LEFT_X, y, RIGHT_X, y);
    doc.setLineDashPattern([], 0);
    return y + 3.5;
}

function row(doc: jsPDF, y: number, label: string, value: string): number {
    doc.text(label, LEFT_X, y);
    doc.text(value, RIGHT_X, y, { align: 'right' });
    return y + LINE;
}

function formatQty(item: ISaleItem): string {
    const unit = item.unit?.name ?? item.product?.baseUnit ?? '';
    const qty = Number(item.quantity);
    return unit ? `${qty} ${unit}` : String(qty);
}

function customerLine(sale: ISale): string {
    if (sale.customer) {
        const name = `${sale.customer.firstName ?? ''} ${sale.customer.lastName ?? ''}`.trim();
        return name ? `Customer: ${name}` : 'Walk-in customer';
    }
    return sale.customerUserId ? 'Customer: (unnamed)' : 'Walk-in customer';
}

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
}

function truncate(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
