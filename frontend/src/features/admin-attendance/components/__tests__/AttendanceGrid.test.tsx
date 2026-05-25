import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { AttendanceGrid } from '../AttendanceGrid';
import type { IAttendance, IEmployee } from '@/types';

vi.mock('@/services/hr.service', () => ({
    hrService: {
        listAttendance: vi.fn(),
        bulkUpsertAttendance: vi.fn(),
    },
}));

vi.mock('react-hot-toast', () => ({
    default: Object.assign(vi.fn(), {
        success: vi.fn(),
        error: vi.fn(),
    }),
}));

import { hrService } from '@/services/hr.service';

const listMock = vi.mocked(hrService.listAttendance);
const bulkMock = vi.mocked(hrService.bulkUpsertAttendance);

function makeEmployee(overrides: Partial<IEmployee> = {}): IEmployee {
    return {
        id: 'emp-1',
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

function makeAttendance(overrides: Partial<IAttendance> = {}): IAttendance {
    return {
        id: 'att-1',
        employeeId: 'emp-1',
        attendanceDate: '2025-06-02',
        checkInTime: '08:05:00',
        checkOutTime: '16:00:00',
        totalHours: 7.92,
        status: 'Present',
        isLate: true,
        lateMinutes: 5,
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

function renderGrid(args: {
    employees: IEmployee[];
    monthValue?: string;
    canPickBranch?: boolean;
}) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={client}>
                <MemoryRouter>{children}</MemoryRouter>
            </QueryClientProvider>
        );
    }
    render(
        <Wrapper>
            <AttendanceGrid
                monthValue={args.monthValue ?? '2025-06'}
                branchId=""
                employees={args.employees}
                canPickBranch={args.canPickBranch ?? true}
            />
        </Wrapper>,
    );
}

describe('AttendanceGrid', () => {
    beforeEach(() => {
        listMock.mockReset();
        bulkMock.mockReset();
        listMock.mockResolvedValue({ rows: [], total: 0 });
    });

    it('renders the empty state when no employees are in scope', () => {
        renderGrid({ employees: [] });
        expect(
            screen.getByText(/no employees in this scope/i),
        ).toBeInTheDocument();
    });

    it('renders employee headers and one row per day', async () => {
        renderGrid({ employees: [makeEmployee()], monthValue: '2025-06' });
        await waitFor(() => expect(listMock).toHaveBeenCalled());
        expect(screen.getByText('Nimal Perera')).toBeInTheDocument();
        expect(screen.getByText('EMP-0001')).toBeInTheDocument();
        const rowHeaders = screen.getAllByRole('rowheader');
        expect(rowHeaders.length).toBe(30);
    });

    it('seeds an existing attendance row into the matching cell', async () => {
        listMock.mockResolvedValue({
            rows: [makeAttendance({ attendanceDate: '2025-06-02' })],
            total: 1,
        });
        renderGrid({ employees: [makeEmployee()], monthValue: '2025-06' });
        await waitFor(() => {
            const select = screen.getByLabelText(
                /status for nimal perera on 2025-06-02/i,
            );
            expect((select as HTMLSelectElement).value).toBe('Present');
        });
    });

    it('changing a status cell marks one pending change and shows the count', async () => {
        renderGrid({ employees: [makeEmployee()], monthValue: '2025-06' });
        await waitFor(() => expect(listMock).toHaveBeenCalled());
        const select = screen.getByLabelText(
            /status for nimal perera on 2025-06-02/i,
        );
        await userEvent.selectOptions(select, 'Present');
        expect(screen.getByText(/1 pending change/i)).toBeInTheDocument();
    });

    it('save grid fires the bulk endpoint with the dirty rows', async () => {
        bulkMock.mockResolvedValue([]);
        renderGrid({ employees: [makeEmployee()], monthValue: '2025-06' });
        await waitFor(() => expect(listMock).toHaveBeenCalled());
        const select = screen.getByLabelText(
            /status for nimal perera on 2025-06-02/i,
        );
        await userEvent.selectOptions(select, 'Present');
        await userEvent.click(
            screen.getByRole('button', { name: /save grid/i }),
        );
        await waitFor(() => expect(bulkMock).toHaveBeenCalledTimes(1));
        const arg = bulkMock.mock.calls[0]?.[0];
        expect(arg?.rows).toEqual([
            {
                employeeId: 'emp-1',
                attendanceDate: '2025-06-02',
                status: 'Present',
            },
        ]);
    });

    it('refetches with the new date range when the month value changes', async () => {
        const { rerender } = (() => {
            const client = new QueryClient({
                defaultOptions: { queries: { retry: false, gcTime: 0 } },
            });
            function Wrapper({ children }: { children: ReactNode }) {
                return (
                    <QueryClientProvider client={client}>
                        <MemoryRouter>{children}</MemoryRouter>
                    </QueryClientProvider>
                );
            }
            return render(
                <Wrapper>
                    <AttendanceGrid
                        monthValue="2025-06"
                        branchId=""
                        employees={[makeEmployee()]}
                        canPickBranch
                    />
                </Wrapper>,
            );
        })();
        await waitFor(() => expect(listMock).toHaveBeenCalled());
        const firstArgs = listMock.mock.calls[0]?.[0];
        expect(firstArgs?.startDate).toBe('2025-06-01');
        rerender(
            <QueryClientProvider
                client={
                    new QueryClient({
                        defaultOptions: {
                            queries: { retry: false, gcTime: 0 },
                        },
                    })
                }
            >
                <MemoryRouter>
                    <AttendanceGrid
                        monthValue="2025-07"
                        branchId=""
                        employees={[makeEmployee()]}
                        canPickBranch
                    />
                </MemoryRouter>
            </QueryClientProvider>,
        );
        await waitFor(() => {
            const calls = listMock.mock.calls.map((c) => c[0]?.startDate);
            expect(calls).toContain('2025-07-01');
        });
    });
});
