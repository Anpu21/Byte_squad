import { formatCurrency } from '@/lib/utils';
import { code128Svg } from './code128';

/** One physical sticker on the sheet. */
export interface ILabelItem {
    name: string;
    barcode: string;
    price: number;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Build a self-contained HTML document of A4 label sheets (3 columns of
 * 38mm-tall stickers — fits common 63.5×38.1mm label paper). Printed
 * through an isolated iframe so its `@page` rule never collides with the
 * 80mm receipt stylesheet that governs `window.print()` on the main
 * document. Labels with an unencodable barcode fall back to text only.
 */
export function buildLabelSheetHtml(labels: ILabelItem[]): string {
    const cells = labels
        .map((label) => {
            const svg = label.barcode ? code128Svg(label.barcode) : null;
            const barcodeBlock = svg
                ? `<div class="bars">${svg}</div><div class="code">${escapeHtml(label.barcode)}</div>`
                : `<div class="code code-only">${escapeHtml(label.barcode || 'No barcode')}</div>`;
            return (
                '<div class="label">' +
                `<div class="name">${escapeHtml(label.name)}</div>` +
                `<div class="price">${escapeHtml(formatCurrency(label.price))}</div>` +
                barcodeBlock +
                '</div>'
            );
        })
        .join('');

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
    grid-template-columns: repeat(3, 1fr);
    gap: 2mm;
  }
  .label {
    height: 38mm;
    padding: 2.5mm 3mm;
    border: 0.2mm dashed #bbb;
    border-radius: 1mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    page-break-inside: avoid;
  }
  .name {
    font-size: 9pt;
    font-weight: 700;
    line-height: 1.2;
    max-height: 8mm;
    overflow: hidden;
  }
  .price {
    font-size: 11pt;
    font-weight: 700;
    margin-top: 0.5mm;
  }
  .bars { margin-top: auto; }
  .bars svg { width: 100%; height: 10mm; display: block; }
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
<div class="sheet">${cells}</div>
</body>
</html>`;
}
