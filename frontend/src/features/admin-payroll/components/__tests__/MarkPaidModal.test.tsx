import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MarkPaidModal } from '../MarkPaidModal';
import type { IPayroll } from '@/types';

vi.mock('../../hooks/usePayrollMutations', () => ({
    useMarkPayrollPaid: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

const PAYROLL = { id: 'p1', netSalary: 50000 } as IPayroll;

describe('MarkPaidModal', () => {
    it('defaults to Cash and only offers Cash / Card', () => {
        render(<MarkPaidModal payroll={PAYROLL} onClose={vi.fn()} />);
        const method = screen.getByRole('combobox') as HTMLSelectElement;
        expect(method.value).toBe('Cash');
        const options = screen.getAllByRole('option').map((o) => o.textContent);
        expect(options).toEqual(['Cash', 'Card']);
    });

    it('shows the optional reference field only for Card', async () => {
        render(<MarkPaidModal payroll={PAYROLL} onClose={vi.fn()} />);
        // Cash (default) → no reference field.
        expect(
            screen.queryByPlaceholderText('Terminal / transfer ref'),
        ).toBeNull();
        await userEvent.selectOptions(screen.getByRole('combobox'), 'Card');
        expect(
            screen.getByPlaceholderText('Terminal / transfer ref'),
        ).toBeInTheDocument();
    });
});
