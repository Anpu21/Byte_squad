import { describe, it, expect, afterAll } from 'vitest';
import i18n from '@/i18n';

/**
 * Guards the shell's `common` namespace: the nav/shell keys the layout renders
 * must resolve, and Tamil must use real translations where present and fall
 * back to English (never the raw key) where not yet translated.
 */
describe('common namespace (shell)', () => {
    afterAll(async () => {
        await i18n.changeLanguage('en');
    });

    it('resolves English nav + shell keys', async () => {
        await i18n.changeLanguage('en');
        expect(i18n.t('nav.pos', { ns: 'common' })).toBe('POS');
        expect(i18n.t('nav.accounting', { ns: 'common' })).toBe('Accounting');
        expect(i18n.t('nav.groups.finance', { ns: 'common' })).toBe('Finance');
        expect(i18n.t('shell.logout', { ns: 'common' })).toBe('Logout');
    });

    it('uses Tamil where translated and falls back to English otherwise', async () => {
        await i18n.changeLanguage('ta');
        // Already translated.
        expect(i18n.t('nav.dashboard', { ns: 'common' })).toBe('டாஷ்போர்டு');
        // Not yet translated → English placeholder, never the raw key.
        const pos = i18n.t('nav.pos', { ns: 'common' });
        expect(pos).toBe('POS');
        expect(pos).not.toBe('nav.pos');
    });
});
