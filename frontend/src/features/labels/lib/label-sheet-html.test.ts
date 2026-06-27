import { describe, expect, it } from 'vitest';
import { buildLabelSheetHtml, unitPriceSuffix } from './label-sheet-html';

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

    it('defaults to the price-tag grid', () => {
        const html = buildLabelSheetHtml([
            { name: 'Rice 5kg', barcode: '4791234567', price: 2350 },
        ]);
        expect(html).toContain('class="sheet sheet--price-tag"');
    });

    it('uses the shelf-edge grid when requested', () => {
        const html = buildLabelSheetHtml(
            [{ name: 'Rice 5kg', barcode: '4791234567', price: 2350 }],
            { layout: 'shelf-edge' },
        );
        expect(html).toContain('class="sheet sheet--shelf-edge"');
    });

    it('prints a batch and expiry caption when provided', () => {
        const html = buildLabelSheetHtml([
            {
                name: 'Milk 1L',
                barcode: '4791234567',
                price: 420,
                batchNo: 'B12',
                expiryDate: '2026-01-01',
            },
        ]);
        expect(html).toContain('Batch B12');
        expect(html).toContain('Exp 2026-01-01');
    });

    it('renders a secondary line when provided', () => {
        const html = buildLabelSheetHtml([
            {
                name: 'Milk 1L',
                barcode: '4791234567',
                price: 420,
                secondaryLine: 'Dairy',
            },
        ]);
        expect(html).toContain('class="secondary"');
        expect(html).toContain('Dairy');
    });

    it('appends a per-unit suffix to the price when provided', () => {
        const html = buildLabelSheetHtml([
            {
                name: 'Apples',
                barcode: '4791234567',
                price: 650,
                unitSuffix: '/kg',
            },
        ]);
        expect(html).toContain('/kg');
    });
});

describe('unitPriceSuffix', () => {
    it('maps measure base units to a price suffix', () => {
        expect(unitPriceSuffix('kg')).toBe('/kg');
        expect(unitPriceSuffix('l')).toBe('/l');
        expect(unitPriceSuffix('unit')).toBe('');
    });
});
