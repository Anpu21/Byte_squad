import { describe, expect, it } from 'vitest';
import { isCompleteNumber, isPartialDecimal } from './numeric-input';

describe('isPartialDecimal', () => {
    it.each<[string, boolean]>([
        ['', true], // mid-clear; the buffer can be empty while the user keeps typing
        ['0', true],
        ['12', true],
        ['12.', true], // partial decimal — user is mid-typing `12.5`
        ['.5', true],
        ['0.5', true],
        ['12.345', true],
        ['12abc', false], // letters
        ['1.2.3', false], // two decimal points
        ['-1', false], // POS rejects negatives via the input filter
        ['1e3', false], // scientific notation
        ['1,000', false], // thousands separator (Sri Lankan POS uses `.`)
        [' 12', false], // leading whitespace
        ['12 ', false], // trailing whitespace
        ['+', false], // bare sign characters
    ])('isPartialDecimal(%j) === %s', (input, expected) => {
        expect(isPartialDecimal(input)).toBe(expected);
    });
});

describe('isCompleteNumber', () => {
    it.each<[string, boolean]>([
        ['12', true],
        ['0', true],
        ['0.5', true],
        ['12.345', true],
        ['-1', true], // commit predicate is permissive; the input filter is the gate
        ['  12  ', true], // trimmed before matching
        ['', false],
        ['0.', false], // trailing decimal — not yet complete
        ['.5', false], // leading decimal — not yet complete
        ['12abc', false],
        ['1.2.3', false],
        ['1e3', false],
        ['1,000', false],
    ])('isCompleteNumber(%j) === %s', (input, expected) => {
        expect(isCompleteNumber(input)).toBe(expected);
    });
});
