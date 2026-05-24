import { describe, it, expect } from 'vitest';
import { formatQuantity } from './format-quantity';

describe('formatQuantity', () => {
    it('renders an integer without decimals', () => {
        expect(formatQuantity(1)).toBe('1');
    });

    it('trims trailing zeros from a whole-number-with-decimal', () => {
        expect(formatQuantity(1.0)).toBe('1');
    });

    it('keeps significant decimals', () => {
        expect(formatQuantity(0.25)).toBe('0.25');
    });

    it('keeps the full 3-decimal precision when present', () => {
        expect(formatQuantity(0.001)).toBe('0.001');
    });

    it('keeps a single decimal digit when that is all the value has', () => {
        expect(formatQuantity(2.5)).toBe('2.5');
    });

    it('renders zero as plain "0"', () => {
        expect(formatQuantity(0)).toBe('0');
    });

    it('renders NaN verbatim so a malformed payload is visible, not hidden', () => {
        expect(formatQuantity(Number.NaN)).toBe('NaN');
    });

    it('renders Infinity verbatim for the same reason as NaN', () => {
        expect(formatQuantity(Number.POSITIVE_INFINITY)).toBe('Infinity');
    });
});
