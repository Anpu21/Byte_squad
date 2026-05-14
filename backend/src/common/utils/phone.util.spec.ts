import { normalizeSriLankaPhone } from './phone.util';

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
    [''],
    ['   '],
    ['123'],
    ['+1234567890'],
    ['+9476'],
    ['00771234567'],
    ['abcd'],
    ['+940771234567'],
    ['0071234567'],
  ])('rejects %s', (input) => {
    expect(normalizeSriLankaPhone(input)).toBeNull();
  });

  it('rejects non-string input', () => {
    expect(normalizeSriLankaPhone(undefined)).toBeNull();
    expect(normalizeSriLankaPhone(null)).toBeNull();
    expect(normalizeSriLankaPhone(771234567)).toBeNull();
  });
});
