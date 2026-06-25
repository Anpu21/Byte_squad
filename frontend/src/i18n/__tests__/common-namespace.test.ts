import { describe, it, expect, afterAll } from 'vitest';
import i18n from '@/i18n';

/**
 * Guards the shell's `common` namespace: the nav/shell keys the layout renders
 * resolve to English source values, and the whole shell is translated to Tamil
 * (no English left in the sidebar/header).
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

    it('renders the whole shell in Tamil', async () => {
        await i18n.changeLanguage('ta');
        expect(i18n.t('nav.dashboard', { ns: 'common' })).toBe('டாஷ்போர்டு');
        expect(i18n.t('nav.pos', { ns: 'common' })).toBe('விற்பனை நிலையம்');
        expect(i18n.t('nav.groups.finance', { ns: 'common' })).toBe('நிதி');
        expect(i18n.t('shell.logout', { ns: 'common' })).toBe('வெளியேறு');
    });
});
