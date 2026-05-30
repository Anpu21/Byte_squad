import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { PosAttendanceWidget } from '../PosAttendanceWidget';
import type { IAttendance } from '@/types';

vi.mock('@/services/hr.service', () => ({
    hrService: {
        checkInSelf: vi.fn(),
        checkOutSelf: vi.fn(),
    },
}));

vi.mock('react-hot-toast', () => ({
    default: Object.assign(vi.fn(), {
        success: vi.fn(),
        error: vi.fn(),
    }),
}));

import { hrService } from '@/services/hr.service';
import toast from 'react-hot-toast';

const checkInMock = vi.mocked(hrService.checkInSelf);
const checkOutMock = vi.mocked(hrService.checkOutSelf);

function makeAttendance(overrides: Partial<IAttendance> = {}): IAttendance {
    return {
        id: 'att-1',
        employeeId: 'emp-1',
        attendanceDate: '2025-06-02',
        checkInTime: '08:05:00',
        checkOutTime: null,
        totalHours: null,
        status: 'Present',
        isLate: false,
        lateMinutes: 0,
        isOvertime: false,
        overtimeHours: 0,
        markedBy: 'Cashier_Self',
        cardsProduced: 0,
        notes: null,
        createdBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

function renderWidget() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );
    }
    render(
        <Wrapper>
            <PosAttendanceWidget />
        </Wrapper>,
    );
}

describe('PosAttendanceWidget', () => {
    beforeEach(() => {
        checkInMock.mockReset();
        checkOutMock.mockReset();
        (toast as unknown as { mockReset?: () => void }).mockReset?.();
        (toast.success as ReturnType<typeof vi.fn>).mockReset?.();
        (toast.error as ReturnType<typeof vi.fn>).mockReset?.();
    });

    it('renders both clock-in and clock-out buttons in their default state', () => {
        renderWidget();
        expect(
            screen.getByRole('button', { name: /clock in/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /clock out/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/not clocked in/i)).toBeInTheDocument();
    });

    it('fires the check-in mutation when "Clock in" is clicked and echoes the time', async () => {
        checkInMock.mockResolvedValue(
            makeAttendance({ checkInTime: '08:05:00' }),
        );
        renderWidget();
        await userEvent.click(
            screen.getByRole('button', { name: /clock in/i }),
        );
        await waitFor(() => expect(checkInMock).toHaveBeenCalledTimes(1));
        await waitFor(() =>
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('08:05'),
            ),
        );
        expect(screen.getByText(/in 08:05/i)).toBeInTheDocument();
    });

    it('shows the server error message when the BE rejects double check-in', async () => {
        checkInMock.mockRejectedValue({
            isAxiosError: true,
            response: { data: { message: 'Already checked in today' } },
        });
        renderWidget();
        await userEvent.click(
            screen.getByRole('button', { name: /clock in/i }),
        );
        await waitFor(() => expect(checkInMock).toHaveBeenCalled());
        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                'Already checked in today',
            ),
        );
    });

    it('fires the check-out mutation when "Clock out" is clicked', async () => {
        checkOutMock.mockResolvedValue(
            makeAttendance({
                checkInTime: '08:05:00',
                checkOutTime: '16:00:00',
            }),
        );
        renderWidget();
        await userEvent.click(
            screen.getByRole('button', { name: /clock out/i }),
        );
        await waitFor(() => expect(checkOutMock).toHaveBeenCalledTimes(1));
        await waitFor(() =>
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringContaining('16:00'),
            ),
        );
    });
});
