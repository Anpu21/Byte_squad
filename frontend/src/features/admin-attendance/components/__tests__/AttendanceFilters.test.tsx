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
}) {
    const { Wrapper } = makeWrapper();
    const onMonthChange = props.onMonthChange ?? vi.fn();
    const onBranchIdChange = props.onBranchIdChange ?? vi.fn();
    render(
        <Wrapper>
            <AttendanceFilters
                monthValue="2025-06"
                onMonthChange={onMonthChange}
                branchId=""
                onBranchIdChange={onBranchIdChange}
                canPickBranch={props.canPickBranch ?? true}
            />
        </Wrapper>,
    );
    return { onMonthChange, onBranchIdChange };
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
});
