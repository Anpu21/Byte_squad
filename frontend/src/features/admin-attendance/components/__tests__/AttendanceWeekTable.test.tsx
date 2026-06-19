import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AttendanceWeekTable } from '../AttendanceWeekTable';
import type { IAttendance, IEmployee } from '@/types';

function emp(id: string, fullName: string, role: string): IEmployee {
    return { id, fullName, role, employeeCode: `EMP-${id}` } as IEmployee;
}

const DAYS = [
    '2026-06-15',
    '2026-06-16',
    '2026-06-17',
    '2026-06-18',
    '2026-06-19',
    '2026-06-20',
    '2026-06-21',
];
const EMPLOYEES = [emp('e1', 'Ravi', 'Courier'), emp('e2', 'Emma', 'Cashier')];
const ROWS: IAttendance[] = [
    {
        employeeId: 'e1',
        attendanceDate: '2026-06-15',
        status: 'Present',
        totalHours: 8,
    } as IAttendance,
];

describe('AttendanceWeekTable', () => {
    it('renders a row per employee and 7 day columns', () => {
        render(
            <AttendanceWeekTable
                employees={EMPLOYEES}
                rows={ROWS}
                days={DAYS}
                isLoading={false}
                onCellClick={vi.fn()}
            />,
        );
        expect(screen.getByText('Ravi')).toBeInTheDocument();
        expect(screen.getByText('Emma')).toBeInTheDocument();
        // 1 "Employee" + 7 day headers.
        expect(screen.getAllByRole('columnheader')).toHaveLength(8);
    });

    it('clicking a cell fires onCellClick with the employee and that date', async () => {
        const onCellClick = vi.fn();
        render(
            <AttendanceWeekTable
                employees={EMPLOYEES}
                rows={ROWS}
                days={DAYS}
                isLoading={false}
                onCellClick={onCellClick}
            />,
        );
        await userEvent.click(
            screen.getByRole('button', {
                name: /edit attendance for ravi on 2026-06-15/i,
            }),
        );
        expect(onCellClick).toHaveBeenCalledWith(EMPLOYEES[0], '2026-06-15');
    });
});
