import { describe, expect, it } from 'vitest';
import { CODE128_WIDTHS, code128Svg, encodeCode128 } from './code128';

describe('CODE128_WIDTHS table', () => {
    it('has 107 entries, each summing to 11 modules (stop = 13)', () => {
        expect(CODE128_WIDTHS).toHaveLength(107);
        CODE128_WIDTHS.forEach((entry, index) => {
            const sum = [...entry].reduce((s, d) => s + Number(d), 0);
            expect(sum).toBe(index === 106 ? 13 : 11);
        });
    });
});

describe('encodeCode128', () => {
    it('uses Code B for mixed input with a valid checksum', () => {
        // Start B (104) + "AB" → symbols 33, 34; checksum =
        // (104 + 33×1 + 34×2) % 103 = 205 % 103 = 102.
        expect(encodeCode128('AB')).toEqual([104, 33, 34, 102, 106]);
    });

    it('packs even-length digit values as Code C pairs', () => {
        // Start C (105) + "1234" → 12, 34; checksum =
        // (105 + 12×1 + 34×2) % 103 = 185 % 103 = 82.
        expect(encodeCode128('1234')).toEqual([105, 12, 34, 82, 106]);
    });

    it('falls back to Code B for odd-length digit values', () => {
        const symbols = encodeCode128('12345');
        expect(symbols?.[0]).toBe(104);
        expect(symbols).toHaveLength(1 + 5 + 1 + 1);
    });

    it('rejects empty and non-ASCII input', () => {
        expect(encodeCode128('')).toBeNull();
        expect(encodeCode128('café')).toBeNull();
    });
});

describe('code128Svg', () => {
    it('renders one rect per bar with quiet zones', () => {
        const svg = code128Svg('1234');
        expect(svg).not.toBeNull();
        // 5 symbols × 3 bars each (every width entry has 3 bars; stop has 4).
        const bars = (svg!.match(/<rect/g) ?? []).length;
        expect(bars).toBe(3 * 4 + 4);
        // Total modules: 10 + 11×4 + 13 + 10 = 77 → ×2 units per module.
        expect(svg).toContain('viewBox="0 0 154 48"');
    });

    it('returns null for unencodable values', () => {
        expect(code128Svg('')).toBeNull();
    });
});
