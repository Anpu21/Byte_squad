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
    onDateChange?: (v: string) => void;
    onBranchIdChange?: (v: string) => void;
    roleOptions?: string[];
    onRoleChange?: (v: string) => void;
}) {
    const { Wrapper } = makeWrapper();
    const onDateChange = props.onDateChange ?? vi.fn();
    const onBranchIdChange = props.onBranchIdChange ?? vi.fn();
    const onRoleChange = props.onRoleChange ?? vi.fn();
    render(
        <Wrapper>
            <AttendanceFilters
                selectedDate="2025-06-15"
                onDateChange={onDateChange}
                branchId=""
                onBranchIdChange={onBranchIdChange}
                canPickBranch={props.canPickBranch ?? true}
                roleFilter=""
                roleOptions={props.roleOptions ?? []}
                onRoleChange={onRoleChange}
            />
        </Wrapper>,
    );
    return { onDateChange, onBranchIdChange, onRoleChange };
}

describe('AttendanceFilters', () => {
    beforeEach(() => {
        vi.mocked(adminService.listBranches).mockResolvedValue([]);
    });

    it('renders the day picker and branch select for admins', () => {
        renderFilters({});
        expect(
            screen.getByLabelText(/pick attendance day/i),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/filter by branch/i)).toBeInTheDocument();
    });

    it('hides the branch select for managers (canPickBranch=false)', () => {
        renderFilters({ canPickBranch: false });
        expect(screen.queryByLabelText(/filter by branch/i)).toBeNull();
    });

    it('fires onDateChange when the previous-day button is used', async () => {
        const onDateChange = vi.fn();
        renderFilters({ onDateChange });
        await userEvent.click(screen.getByLabelText(/previous day/i));
        expect(onDateChange).toHaveBeenCalledWith('2025-06-14');
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
