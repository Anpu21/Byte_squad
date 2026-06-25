import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import CommandPalette from '../CommandPalette';

// Mutable role so we can exercise role-gating from the same mock.
const { auth } = vi.hoisted(() => ({ auth: { role: 'admin' } }));
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({ user: { role: auth.role } }),
}));
// Return the key verbatim so i18n keys are stable, predictable labels —
// preserve the rest of the module so i18n init (initReactI18next) still works.
vi.mock('react-i18next', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-i18next')>();
    return { ...actual, useTranslation: () => ({ t: (k: string) => k }) };
});

const loc = { value: '' };
function Probe() {
    const l = useLocation();
    useEffect(() => {
        loc.value = l.pathname + l.search;
    });
    return null;
}

function renderPalette() {
    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Probe />
            <CommandPalette open onClose={() => {}} />
        </MemoryRouter>,
    );
}

describe('CommandPalette', () => {
    beforeEach(() => {
        auth.role = 'admin';
        loc.value = '';
    });

    it('lists navigable destinations behind a combobox', () => {
        renderPalette();
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });

    it('filters destinations by query', async () => {
        const user = userEvent.setup();
        renderPalette();
        await user.type(screen.getByRole('combobox'), 'payroll');
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent('Payroll');
    });

    it('navigates to the matched destination on Enter', async () => {
        const user = userEvent.setup();
        renderPalette();
        await user.type(screen.getByRole('combobox'), 'payroll');
        await user.keyboard('{Enter}');
        expect(loc.value).toContain('tab=payroll');
    });

    it('role-gates destinations (a cashier cannot reach HR/payroll)', async () => {
        auth.role = 'cashier';
        const user = userEvent.setup();
        renderPalette();
        await user.type(screen.getByRole('combobox'), 'payroll');
        expect(screen.queryByRole('option')).not.toBeInTheDocument();
        expect(screen.getByText('shell.noResults')).toBeInTheDocument();
    });
});
