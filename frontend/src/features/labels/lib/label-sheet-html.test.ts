import { describe, expect, it } from 'vitest';
import { buildLabelSheetHtml } from './label-sheet-html';

describe('buildLabelSheetHtml', () => {
    it('renders one cell per label with name, price, and barcode svg', () => {
        const html = buildLabelSheetHtml([
            { name: 'Rice 5kg', barcode: '4791234567', price: 2350 },
            { name: 'Rice 5kg', barcode: '4791234567', price: 2350 },
        ]);
        expect((html.match(/class="label"/g) ?? []).length).toBe(2);
        expect(html).toContain('Rice 5kg');
        expect((html.match(/<svg/g) ?? []).length).toBe(2);
        expect(html).toContain('@page { size: A4');
    });

    it('escapes HTML in product names', () => {
        const html = buildLabelSheetHtml([
            { name: 'Choc <Bar> & "Co"', barcode: '12', price: 100 },
        ]);
        expect(html).toContain('Choc &lt;Bar&gt; &amp; &quot;Co&quot;');
        expect(html).not.toContain('<Bar>');
    });

    it('falls back to text when the barcode cannot be encoded', () => {
        const html = buildLabelSheetHtml([
            { name: 'No code', barcode: '', price: 50 },
        ]);
        expect(html).not.toContain('<svg');
        expect(html).toContain('No barcode');
    });
});
