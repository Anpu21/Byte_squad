import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IAttendance, IEmployee } from '@/types';
import { AttendanceEditModal } from '../AttendanceEditModal';

const mocks = vi.hoisted(() => ({
    mutateAsync: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
}));

vi.mock('../../hooks/useBulkUpsertAttendance', () => ({
    useBulkUpsertAttendance: () => ({
        mutateAsync: mocks.mutateAsync,
        isPending: false,
    }),
}));

vi.mock('react-hot-toast', () => ({
    default: {
        success: mocks.toastSuccess,
        error: mocks.toastError,
    },
}));

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
        checkInTime: '08:00:00',
        checkOutTime: '16:00:00',
        totalHours: 8,
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

function renderModal(props: {
    existing?: IAttendance | null;
    onClose?: () => void;
}) {
    return render(
        <AttendanceEditModal
            isOpen
            onClose={props.onClose ?? vi.fn()}
            employee={employeeStub()}
            date="2026-06-01"
            existing={props.existing ?? attendanceStub()}
        />,
    );
}

describe('AttendanceEditModal', () => {
    beforeEach(() => {
        mocks.mutateAsync.mockResolvedValue([]);
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
            window.setTimeout(cb, 0),
        );
        vi.stubGlobal('cancelAnimationFrame', (id: number) =>
            window.clearTimeout(id),
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('saves status and totalHours for working statuses', async () => {
        const onClose = vi.fn();
        renderModal({ onClose });

        expect(screen.queryByLabelText(/check-in time/i)).toBeNull();
        expect(screen.queryByLabelText(/check-out time/i)).toBeNull();

        const duration = screen.getByLabelText(/duration hours/i);
        await userEvent.clear(duration);
        await userEvent.type(duration, '6.25');
        await userEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(mocks.mutateAsync).toHaveBeenCalledWith({
                rows: [
                    {
                        employeeId: 'e-1',
                        attendanceDate: '2026-06-01',
                        status: 'Present',
                        totalHours: 6.25,
                    },
                ],
            });
        });
        expect(onClose).toHaveBeenCalled();
    });

    it('clears duration and omits totalHours for non-working statuses', async () => {
        renderModal({});

        await userEvent.selectOptions(
            screen.getByLabelText(/attendance status/i),
            'Leave',
        );

        const duration = screen.getByLabelText(/duration hours/i);
        expect(duration).toBeDisabled();
        expect(duration).toHaveValue(null);

        await userEvent.click(screen.getByRole('button', { name: /save/i }));

        await waitFor(() => {
            expect(mocks.mutateAsync).toHaveBeenCalled();
        });
        const payload = mocks.mutateAsync.mock.calls[0][0];
        expect(payload.rows[0]).toEqual({
            employeeId: 'e-1',
            attendanceDate: '2026-06-01',
            status: 'Leave',
        });
        expect(payload.rows[0]).not.toHaveProperty('totalHours');
    });
});
