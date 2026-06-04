import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
    cleanup();
    // Prevent localStorage state (POS cart, theme, language, …) leaking
    // between tests in the same file.
    localStorage.clear();
});
