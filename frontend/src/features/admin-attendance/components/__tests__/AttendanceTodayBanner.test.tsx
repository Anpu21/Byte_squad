import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { AttendanceTodayBanner } from '../AttendanceTodayBanner';

vi.mock('@/services/hr.service', () => ({
    hrService: {
        getBranchTodayStatus: vi.fn(),
        bulkUpsertAttendance: vi.fn(),
    },
}));

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
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

const PENDING_ONE = {
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
};

describe('AttendanceTodayBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(hrService.bulkUpsertAttendance).mockResolvedValue([]);
    });

    it('clicking a pending name fires onMark with the employee id', async () => {
        vi.mocked(hrService.getBranchTodayStatus).mockResolvedValue(PENDING_ONE);
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

    it('"Mark all present" bulk-marks every pending employee Present for today', async () => {
        vi.mocked(hrService.getBranchTodayStatus).mockResolvedValue(PENDING_ONE);
        const Wrapper = makeWrapper();
        render(
            <Wrapper>
                <AttendanceTodayBanner onMark={vi.fn()} />
            </Wrapper>,
        );

        await userEvent.click(
            await screen.findByRole('button', { name: 'Mark all present' }),
        );
        expect(hrService.bulkUpsertAttendance).toHaveBeenCalledWith({
            rows: [
                {
                    employeeId: 'e1',
                    attendanceDate: '2026-06-19',
                    status: 'Present',
                },
            ],
        });
    });

    it('per-person Absent marks just that person', async () => {
        vi.mocked(hrService.getBranchTodayStatus).mockResolvedValue(PENDING_ONE);
        const Wrapper = makeWrapper();
        render(
            <Wrapper>
                <AttendanceTodayBanner onMark={vi.fn()} />
            </Wrapper>,
        );

        await userEvent.click(
            await screen.findByRole('button', { name: 'Absent' }),
        );
        expect(hrService.bulkUpsertAttendance).toHaveBeenCalledWith({
            rows: [
                {
                    employeeId: 'e1',
                    attendanceDate: '2026-06-19',
                    status: 'Absent',
                },
            ],
        });
    });

    it('shows the all-recorded state with no action buttons', async () => {
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
