/**
 * Jest setup file — runs before every test suite.
 * Adds custom DOM matchers from @testing-library/jest-dom.
 */
import '@testing-library/jest-dom';

import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextEncoder, TextDecoder });

// Mock localStorage for tests (Electron/jsdom may not have it)
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
