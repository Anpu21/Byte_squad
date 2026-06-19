import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { AttendanceTodayBanner } from '../AttendanceTodayBanner';

vi.mock('@/services/hr.service', () => ({
    hrService: { getBranchTodayStatus: vi.fn() },
}));

import { hrService } from '@/services/hr.service';

function makeWrapper() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );
    };
}

describe('AttendanceTodayBanner', () => {
    beforeEach(() => vi.clearAllMocks());

    it('clicking a pending name fires onMark with the employee id', async () => {
        vi.mocked(hrService.getBranchTodayStatus).mockResolvedValue({
            date: '2026-06-19',
            total: 2,
            recorded: 1,
            pendingCount: 1,
            pending: [
                {
                    employeeId: 'e1',
                    employeeCode: 'EMP-1',
                    fullName: 'Ravi',
                    role: 'Courier',
                },
            ],
        });
        const onMark = vi.fn();
        const Wrapper = makeWrapper();
        render(
            <Wrapper>
                <AttendanceTodayBanner onMark={onMark} />
            </Wrapper>,
        );

        const chip = await screen.findByRole('button', { name: /ravi/i });
        await userEvent.click(chip);
        expect(onMark).toHaveBeenCalledWith('e1');
    });

    it('shows the all-recorded state with no pending buttons', async () => {
        vi.mocked(hrService.getBranchTodayStatus).mockResolvedValue({
            date: '2026-06-19',
            total: 2,
            recorded: 2,
            pendingCount: 0,
            pending: [],
        });
        const Wrapper = makeWrapper();
        render(
            <Wrapper>
                <AttendanceTodayBanner onMark={vi.fn()} />
            </Wrapper>,
        );

        expect(
            await screen.findByText(/all 2 staff are recorded/i),
        ).toBeInTheDocument();
        expect(screen.queryByRole('button')).toBeNull();
    });
});
