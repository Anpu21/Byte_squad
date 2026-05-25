import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { AttendanceFilters } from '../AttendanceFilters';
import type { IEmployee } from '@/types';

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

function renderFilters(props: {
    canPickBranch?: boolean;
    onMonthChange?: (v: string) => void;
    onBranchIdChange?: (v: string) => void;
    onEmployeeIdChange?: (v: string) => void;
}) {
    const { Wrapper } = makeWrapper();
    const onMonthChange = props.onMonthChange ?? vi.fn();
    const onBranchIdChange = props.onBranchIdChange ?? vi.fn();
    const onEmployeeIdChange = props.onEmployeeIdChange ?? vi.fn();
    render(
        <Wrapper>
            <AttendanceFilters
                monthValue="2025-06"
                onMonthChange={onMonthChange}
                branchId=""
                onBranchIdChange={onBranchIdChange}
                employeeId=""
                onEmployeeIdChange={onEmployeeIdChange}
                canPickBranch={props.canPickBranch ?? true}
                employees={[
                    employeeStub(),
                    employeeStub({
                        id: 'e-2',
                        fullName: 'Sara Silva',
                        employeeCode: 'EMP-0002',
                    }),
                ]}
            />
        </Wrapper>,
    );
    return { onMonthChange, onBranchIdChange, onEmployeeIdChange };
}

describe('AttendanceFilters', () => {
    beforeEach(() => {
        vi.mocked(adminService.listBranches).mockResolvedValue([]);
    });

    it('renders the month picker, branch select (admin), and employee select', () => {
        renderFilters({});
        expect(
            screen.getByLabelText(/pick attendance month/i),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/filter by branch/i)).toBeInTheDocument();
        expect(
            screen.getByLabelText(/filter by employee/i),
        ).toBeInTheDocument();
    });

    it('hides the branch select for managers (canPickBranch=false)', () => {
        renderFilters({ canPickBranch: false });
        expect(screen.queryByLabelText(/filter by branch/i)).toBeNull();
    });

    it('fires onEmployeeIdChange when an employee is picked', async () => {
        const onEmployeeIdChange = vi.fn();
        renderFilters({ onEmployeeIdChange });
        await userEvent.selectOptions(
            screen.getByLabelText(/filter by employee/i),
            'e-2',
        );
        expect(onEmployeeIdChange).toHaveBeenCalledWith('e-2');
    });
});
