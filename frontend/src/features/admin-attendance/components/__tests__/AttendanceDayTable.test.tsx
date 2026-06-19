import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { AttendanceDayTable } from '../AttendanceDayTable';
import type { IAttendance, IEmployee } from '@/types';

vi.mock('@/services/hr.service', () => ({
    hrService: { bulkUpsertAttendance: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

import { hrService } from '@/services/hr.service';

function makeWrapper() {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    });
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );
    };
}

function emp(id: string, fullName: string, role: string): IEmployee {
    return { id, fullName, role, employeeCode: `EMP-${id}` } as IEmployee;
}

const EMPLOYEES = [emp('e1', 'Ravi', 'Courier'), emp('e2', 'Emma', 'Cashier')];
const ROWS: IAttendance[] = [
    {
        employeeId: 'e1',
        attendanceDate: '2026-06-19',
        status: 'Present',
        checkInTime: '08:00:00',
        checkOutTime: '16:30:00',
        totalHours: 8.5,
    } as IAttendance,
];

function renderTable(onEdit = vi.fn()) {
    const Wrapper = makeWrapper();
    render(
        <Wrapper>
            <AttendanceDayTable
                employees={EMPLOYEES}
                rows={ROWS}
                date="2026-06-19"
                isLoading={false}
                onEdit={onEdit}
            />
        </Wrapper>,
    );
    return { onEdit };
}

describe('AttendanceDayTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(hrService.bulkUpsertAttendance).mockResolvedValue([]);
    });

    it('renders a row per employee', () => {
        renderTable();
        expect(screen.getByText('Ravi')).toBeInTheDocument();
        expect(screen.getByText('Emma')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Mark all present' }),
        ).toBeInTheDocument();
    });

    it('a per-row Present marks just that employee for the day', async () => {
        renderTable();
        const presentButtons = screen.getAllByRole('button', {
            name: 'Present',
        });
        await userEvent.click(presentButtons[0]);
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

    it('"Mark all present" marks every visible employee for the day', async () => {
        renderTable();
        await userEvent.click(
            screen.getByRole('button', { name: 'Mark all present' }),
        );
        expect(hrService.bulkUpsertAttendance).toHaveBeenCalledWith({
            rows: [
                {
                    employeeId: 'e1',
                    attendanceDate: '2026-06-19',
                    status: 'Present',
                },
                {
                    employeeId: 'e2',
                    attendanceDate: '2026-06-19',
                    status: 'Present',
                },
            ],
        });
    });

    it('the edit (pencil) button opens the modal via onEdit', async () => {
        const { onEdit } = renderTable();
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        await userEvent.click(editButtons[0]);
        expect(onEdit).toHaveBeenCalledWith(EMPLOYEES[0]);
    });
});
