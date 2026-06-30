import { describe, expect, it } from 'vitest';
import { parseWeightBarcode } from './parse-weight-barcode';

describe('parseWeightBarcode', () => {
    it('decodes a number-system-2 UPC-A into PLU + weight in kg', () => {
        // 2 | 00042 | 01250 | check 8  → PLU 00042, 1.250 kg
        expect(parseWeightBarcode('200042012508')).toEqual({
            pluCode: '00042',
            weightKg: 1.25,
        });
        // 2 | 12345 | 02500 | check 0  → PLU 12345, 2.500 kg
        expect(parseWeightBarcode('212345025000')).toEqual({
            pluCode: '12345',
            weightKg: 2.5,
        });
    });

    it('accepts the zero-extended EAN-13 form scanners emit', () => {
        expect(parseWeightBarcode('0200042012508')).toEqual({
            pluCode: '00042',
            weightKg: 1.25,
        });
    });

    it('trims surrounding whitespace', () => {
        expect(parseWeightBarcode('  200042012508 ')).toEqual({
            pluCode: '00042',
            weightKg: 1.25,
        });
    });

    it('rejects a bad check digit', () => {
        expect(parseWeightBarcode('200042012507')).toBeNull();
    });

    it('rejects a non-weight number system (wrong flag digit)', () => {
        expect(parseWeightBarcode('100042012508')).toBeNull();
    });

    it('rejects zero weight', () => {
        expect(parseWeightBarcode('200042000000')).toBeNull();
    });

    it('rejects wrong length and non-numeric input', () => {
        expect(parseWeightBarcode('200042')).toBeNull();
        expect(parseWeightBarcode('2000420125080')).toBeNull();
        expect(parseWeightBarcode('not-a-barcode')).toBeNull();
        expect(parseWeightBarcode('')).toBeNull();
    });
});
