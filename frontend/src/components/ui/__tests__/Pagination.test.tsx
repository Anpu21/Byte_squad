import { describe, it, expect } from 'vitest';
import { buildPageWindow } from '../Pagination';

describe('buildPageWindow', () => {
    it('lists every page when they fit within the window', () => {
        expect(buildPageWindow(1, 1, 5)).toEqual([1]);
        expect(buildPageWindow(1, 2, 5)).toEqual([1, 2]);
        expect(buildPageWindow(3, 5, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('anchors to the start for early pages', () => {
        expect(buildPageWindow(1, 20, 5)).toEqual([1, 2, 3, 4, 5]);
        expect(buildPageWindow(3, 20, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('centers the window around the current page in the middle', () => {
        expect(buildPageWindow(10, 20, 5)).toEqual([8, 9, 10, 11, 12]);
    });

    it('anchors to the end for late pages', () => {
        expect(buildPageWindow(19, 20, 5)).toEqual([16, 17, 18, 19, 20]);
        expect(buildPageWindow(20, 20, 5)).toEqual([16, 17, 18, 19, 20]);
    });
});
