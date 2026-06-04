import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IAttendance, IEmployee } from '@/types';
import { AttendanceWeeklyTables } from '../AttendanceWeeklyTables';

function employeeStub(overrides: Partial<IEmployee> = {}): IEmployee {
    return {
        id: 'e-1',
        employeeCode: 'EMP-0001',
        userId: null,
        branchId: 'b-1',
        fullName: 'Nimal Perera',
        nameWithInitials: null,
        nic: null,
        dateOfBirth: null,
        gender: null,
        maritalStatus: null,
        contactPhone: '+94770000000',
        contactPhone2: null,
        email: null,
        permanentAddress: null,
        currentAddress: null,
        city: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        emergencyContactRelationship: null,
        hireDate: '2024-05-01',
        confirmationDate: null,
        employeeType: 'Permanent',
        role: 'Cashier',
        workingHoursStart: '08:00:00',
        workingHoursEnd: '16:00:00',
        epfEligible: false,
        etfEligible: false,
        epfNumber: null,
        etfNumber: null,
        bankName: null,
        bankAccountNo: null,
        bankBranch: null,
        bankAccountName: null,
        status: 'Active',
        resignationDate: null,
        resignationReason: null,
        terminationDate: null,
        terminationReason: null,
        notes: null,
        photoUrl: null,
        annualLeaveBalance: 14,
        createdBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

function attendanceStub(overrides: Partial<IAttendance> = {}): IAttendance {
    return {
        id: 'a-1',
        employeeId: 'e-1',
        attendanceDate: '2026-06-01',
        checkInTime: null,
        checkOutTime: null,
        totalHours: null,
        status: 'Present',
        isLate: false,
        lateMinutes: 0,
        isOvertime: false,
        overtimeHours: 0,
        markedBy: 'Manual',
        cardsProduced: 0,
        notes: null,
        createdBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

function renderWeeklyTables(props: {
    monthValue?: string;
    rows?: IAttendance[];
    onCellClick?: (employee: IEmployee, date: string) => void;
}) {
    return render(
        <AttendanceWeeklyTables
            employees={[employeeStub()]}
            rows={props.rows ?? []}
            monthValue={props.monthValue ?? '2026-06'}
            isLoading={false}
            onCellClick={props.onCellClick ?? vi.fn()}
        />,
    );
}

describe('AttendanceWeeklyTables', () => {
    it('renders one roster table per week with Monday-Sunday headings', () => {
        renderWeeklyTables({});

        for (const day of [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
        ]) {
            expect(
                screen.getAllByRole('columnheader', { name: day }).length,
            ).toBeGreaterThan(0);
        }
    });

    it('updates the displayed dates when the month changes', () => {
        const { rerender } = render(
            <AttendanceWeeklyTables
                employees={[employeeStub()]}
                rows={[]}
                monthValue="2026-06"
                isLoading={false}
                onCellClick={vi.fn()}
            />,
        );

        expect(
            screen.getByLabelText(/Nimal Perera on 2026-06-01/i),
        ).toBeInTheDocument();

        rerender(
            <AttendanceWeeklyTables
                employees={[employeeStub()]}
                rows={[]}
                monthValue="2026-07"
                isLoading={false}
                onCellClick={vi.fn()}
            />,
        );

        expect(
            screen.queryByLabelText(/Nimal Perera on 2026-06-01/i),
        ).toBeNull();
        expect(
            screen.getByLabelText(/Nimal Perera on 2026-07-01/i),
        ).toBeInTheDocument();
    });

    it('shows status and formatted duration without time input placeholders', () => {
        renderWeeklyTables({
            rows: [
                attendanceStub({
                    checkInTime: '08:00:00',
                    checkOutTime: '15:30:00',
                    totalHours: 7.5,
                    status: 'Present',
                }),
            ],
        });

        const cell = screen.getByLabelText(
            /Nimal Perera on 2026-06-01, currently Present/i,
        );
        expect(within(cell).getByText('Present')).toBeInTheDocument();
        expect(within(cell).getByText('7.5h')).toBeInTheDocument();
        expect(screen.queryByText('08:00:00')).toBeNull();
        expect(screen.queryByText('15:30:00')).toBeNull();
        expect(screen.queryByRole('textbox')).toBeNull();
    });

    it('defaults missing weekdays to Absent and weekends to Weekend', () => {
        renderWeeklyTables({});

        expect(
            screen.getByLabelText(
                /Nimal Perera on 2026-06-02, currently Absent/i,
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText(
                /Nimal Perera on 2026-06-06, currently Weekend/i,
            ),
        ).toBeInTheDocument();
    });

    it('opens editing for the clicked employee and date', async () => {
        const onCellClick = vi.fn();
        renderWeeklyTables({ onCellClick });

        await userEvent.click(
            screen.getByLabelText(/Nimal Perera on 2026-06-03/i),
        );

        expect(onCellClick).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'e-1' }),
            '2026-06-03',
        );
    });
});
