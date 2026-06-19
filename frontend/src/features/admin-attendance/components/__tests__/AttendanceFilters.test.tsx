import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { AttendanceFilters } from '../AttendanceFilters';

vi.mock('@/services/admin.service', () => ({
    adminService: {
        listBranches: vi.fn(),
    },
}));

import { adminService } from '@/services/admin.service';

function makeWrapper() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );
    }
    return { Wrapper };
}

function renderFilters(props: {
    canPickBranch?: boolean;
    onMonthChange?: (v: string) => void;
    onBranchIdChange?: (v: string) => void;
    roleOptions?: string[];
    onRoleChange?: (v: string) => void;
}) {
    const { Wrapper } = makeWrapper();
    const onMonthChange = props.onMonthChange ?? vi.fn();
    const onBranchIdChange = props.onBranchIdChange ?? vi.fn();
    const onRoleChange = props.onRoleChange ?? vi.fn();
    render(
        <Wrapper>
            <AttendanceFilters
                monthValue="2025-06"
                onMonthChange={onMonthChange}
                branchId=""
                onBranchIdChange={onBranchIdChange}
                canPickBranch={props.canPickBranch ?? true}
                roleFilter=""
                roleOptions={props.roleOptions ?? []}
                onRoleChange={onRoleChange}
            />
        </Wrapper>,
    );
    return { onMonthChange, onBranchIdChange, onRoleChange };
}

describe('AttendanceFilters', () => {
    beforeEach(() => {
        vi.mocked(adminService.listBranches).mockResolvedValue([]);
    });

    it('renders the month picker and branch select for admins', () => {
        renderFilters({});
        expect(
            screen.getByLabelText(/pick attendance month/i),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/filter by branch/i)).toBeInTheDocument();
    });

    it('hides the branch select for managers (canPickBranch=false)', () => {
        renderFilters({ canPickBranch: false });
        expect(screen.queryByLabelText(/filter by branch/i)).toBeNull();
    });

    it('fires onMonthChange when the previous month button is used', async () => {
        const onMonthChange = vi.fn();
        renderFilters({ onMonthChange });
        await userEvent.click(screen.getByLabelText(/previous month/i));
        expect(onMonthChange).toHaveBeenCalledWith('2025-05');
    });

    it('hides the role filter when fewer than two roles are present', () => {
        renderFilters({ roleOptions: ['Courier'] });
        expect(screen.queryByLabelText(/filter by role/i)).toBeNull();
    });

    it('shows the role filter and fires onRoleChange when multiple roles exist', async () => {
        const onRoleChange = vi.fn();
        renderFilters({ roleOptions: ['Cashier', 'Courier'], onRoleChange });
        await userEvent.selectOptions(
            screen.getByLabelText(/filter by role/i),
            'Courier',
        );
        expect(onRoleChange).toHaveBeenCalledWith('Courier');
    });
});
