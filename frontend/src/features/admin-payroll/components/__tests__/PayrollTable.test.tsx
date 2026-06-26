import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { PayrollTable } from '../PayrollTable';
import type { IEmployee, IPayroll } from '@/types';

vi.mock('../../hooks/usePayrollMutations', () => ({
    useApprovePayroll: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useCancelPayroll: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useMarkPayrollPaid: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useConfirm', () => ({
    useConfirm: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

const EMPLOYEES = [{ id: 'e1', fullName: 'Jane Doe' } as IEmployee];
const ROWS = [
    {
        id: 'p1',
        employeeId: 'e1',
        grossSalary: 100,
        totalDeductions: 10,
        netSalary: 90,
        paymentStatus: 'Approved',
        paymentDate: null,
    } as IPayroll,
];

function renderTable(canManage: boolean) {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={client}>
                {children}
            </QueryClientProvider>
        );
    }
    return render(
        <Wrapper>
            <PayrollTable
                rows={ROWS}
                employees={EMPLOYEES}
                isLoading={false}
                canManage={canManage}
            />
        </Wrapper>,
    );
}

describe('PayrollTable role gating', () => {
    it('hides the lifecycle actions for a manager (read-only)', () => {
        renderTable(false);
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(
            screen.queryByRole('columnheader', { name: 'Actions' }),
        ).toBeNull();
        expect(
            screen.queryByRole('button', { name: 'Mark paid' }),
        ).toBeNull();
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    });

    it('shows the lifecycle actions for an admin', () => {
        renderTable(true);
        expect(
            screen.getByRole('columnheader', { name: 'Actions' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Mark paid' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Cancel' }),
        ).toBeInTheDocument();
    });
});
