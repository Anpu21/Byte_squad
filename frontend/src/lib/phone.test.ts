import { describe, expect, it } from 'vitest';
import { isValidSriLankaPhone, normalizeSriLankaPhone } from './phone';

describe('normalizeSriLankaPhone', () => {
    it.each([
        ['+94771234567', '+94771234567'],
        ['0094771234567', '+94771234567'],
        ['0771234567', '+94771234567'],
        ['077-123-4567', '+94771234567'],
        ['077 123 4567', '+94771234567'],
        ['+94 77 123 4567', '+94771234567'],
        ['(077) 123-4567', '+94771234567'],
    ])('normalizes %s to %s', (input, expected) => {
        expect(normalizeSriLankaPhone(input)).toBe(expected);
    });

    it.each([
        '',
        '   ',
        '123',
        '+1234567890',
        '+9476',
        '00771234567',
        'abcd',
        '+940771234567',
        '0071234567',
    ])('rejects %s', (input) => {
        expect(normalizeSriLankaPhone(input)).toBeNull();
    });
});

describe('isValidSriLankaPhone', () => {
    it('returns true for valid input', () => {
        expect(isValidSriLankaPhone('+94771234567')).toBe(true);
        expect(isValidSriLankaPhone('077 123 4567')).toBe(true);
    });
    it('returns false for invalid input', () => {
        expect(isValidSriLankaPhone('123')).toBe(false);
        expect(isValidSriLankaPhone('')).toBe(false);
    });
});
