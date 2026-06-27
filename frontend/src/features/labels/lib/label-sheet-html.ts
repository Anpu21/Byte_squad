import { formatCurrency } from '@/lib/utils';
import { code128Svg } from './code128';

/** Visual style of a printed label. */
export type LabelLayout = 'price-tag' | 'shelf-edge';

/** One physical sticker on the sheet. */
export interface ILabelItem {
    name: string;
    barcode: string;
    price: number;
    /** Optional small line under the name (e.g. category or pack size). */
    secondaryLine?: string;
    /** Batch number — printed as a caption when present (e.g. for a GRN). */
    batchNo?: string | null;
    /** Expiry date (`YYYY-MM-DD`) — printed beside the batch when present. */
    expiryDate?: string | null;
}

export interface IBuildLabelSheetOptions {
    /** Sticker layout; defaults to the compact price tag. */
    layout?: LabelLayout;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** "Batch B12 · Exp 2026-01-01" — empty when neither field is set. */
function batchCaption(label: ILabelItem): string {
    const parts: string[] = [];
    if (label.batchNo) parts.push(`Batch ${label.batchNo}`);
    if (label.expiryDate) parts.push(`Exp ${label.expiryDate}`);
    return parts.join(' · ');
}

function labelCell(label: ILabelItem): string {
    const svg = label.barcode ? code128Svg(label.barcode) : null;
    const barcodeBlock = svg
        ? `<div class="bars">${svg}</div><div class="code">${escapeHtml(label.barcode)}</div>`
        : `<div class="code code-only">${escapeHtml(label.barcode || 'No barcode')}</div>`;
    const secondary = label.secondaryLine
        ? `<div class="secondary">${escapeHtml(label.secondaryLine)}</div>`
        : '';
    const caption = batchCaption(label);
    const batch = caption ? `<div class="batch">${escapeHtml(caption)}</div>` : '';
    return (
        '<div class="label">' +
        `<div class="name">${escapeHtml(label.name)}</div>` +
        secondary +
        `<div class="price">${escapeHtml(formatCurrency(label.price))}</div>` +
        batch +
        barcodeBlock +
        '</div>'
    );
}

/**
 * Build a self-contained HTML document of A4 label sheets, printed through an
 * isolated iframe so its `@page` rule never collides with the 80mm receipt
 * stylesheet that governs `window.print()` on the main document. Labels with
 * an unencodable barcode fall back to text only.
 *
 * Two layouts share the same markup, switched by a modifier class on the
 * sheet:
 * - `price-tag` (default): 3 columns of 38mm stickers — fits common
 *   63.5×38.1mm label paper.
 * - `shelf-edge`: 2 columns of taller cards with a large, shelf-legible
 *   price — for shelf-edge talkers.
 *
 * Optional `secondaryLine` (e.g. category) and `batchNo`/`expiryDate` captions
 * render only when present, so callers opt in per use case.
 */
export function buildLabelSheetHtml(
    labels: ILabelItem[],
    options: IBuildLabelSheetOptions = {},
): string {
    const layout = options.layout ?? 'price-tag';
    const cells = labels.map(labelCell).join('');

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Product labels</title>
<style>
  @page { size: A4; margin: 8mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    background: #fff;
  }
  .sheet {
    display: grid;
    gap: 2mm;
  }
  .sheet--price-tag { grid-template-columns: repeat(3, 1fr); }
  .sheet--shelf-edge { grid-template-columns: repeat(2, 1fr); }
  .label {
    padding: 2.5mm 3mm;
    border: 0.2mm dashed #bbb;
    border-radius: 1mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    page-break-inside: avoid;
  }
  .sheet--price-tag .label { height: 38mm; }
  .sheet--shelf-edge .label { height: 50mm; }
  .name {
    font-weight: 700;
    line-height: 1.2;
    overflow: hidden;
  }
  .sheet--price-tag .name { font-size: 9pt; max-height: 8mm; }
  .sheet--shelf-edge .name { font-size: 12pt; max-height: 12mm; }
  .secondary {
    font-size: 7pt;
    color: #444;
    margin-top: 0.5mm;
    text-transform: uppercase;
    letter-spacing: 0.3mm;
  }
  .price { font-weight: 800; }
  .sheet--price-tag .price { font-size: 11pt; margin-top: 0.5mm; }
  .sheet--shelf-edge .price { font-size: 22pt; margin-top: 1mm; }
  .batch { font-size: 6.5pt; color: #333; margin-top: 0.5mm; }
  .bars { margin-top: auto; }
  .bars svg { width: 100%; display: block; }
  .sheet--price-tag .bars svg { height: 10mm; }
  .sheet--shelf-edge .bars svg { height: 12mm; }
  .code {
    font-size: 7pt;
    letter-spacing: 0.5mm;
    text-align: center;
    margin-top: 0.5mm;
  }
  .code-only { margin-top: auto; text-align: left; }
</style>
</head>
<body>
<div class="sheet sheet--${layout}">${cells}</div>
</body>
</html>`;
}
