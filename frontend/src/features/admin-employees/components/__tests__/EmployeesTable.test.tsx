import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { EmployeesTable } from '../EmployeesTable';
import { UserRole } from '@/constants/enums';
import type { IEmployee, IEmployeesListResponse } from '@/types';

vi.mock('@/services/hr.service', () => ({
    hrService: {
        listEmployees: vi.fn(),
    },
}));

vi.mock('@/services/admin.service', () => ({
    adminService: {
        listBranches: vi.fn().mockResolvedValue([]),
    },
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: {
            id: 'u1',
            email: 'admin@example.com',
            firstName: 'Ada',
            lastName: 'Admin',
            avatarUrl: null,
            role: UserRole.ADMIN,
            branchId: null,
            isFirstLogin: false,
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    }),
}));

import { hrService } from '@/services/hr.service';
const listMock = vi.mocked(hrService.listEmployees);

function makeRow(overrides: Partial<IEmployee> = {}): IEmployee {
    return {
        id: 'e-1',
        employeeCode: 'EMP-0001',
        userId: null,
        branchId: 'b-1',
        fullName: 'Nimal Perera',
        nameWithInitials: null,
        nic: '200012345678',
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

function renderTable() {
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
            <EmployeesTable />
        </Wrapper>,
    );
}

describe('EmployeesTable', () => {
    beforeEach(() => {
        listMock.mockReset();
    });

    it('renders the employee rows with code, role, NIC, phone, and hire date', async () => {
        const response: IEmployeesListResponse = {
            rows: [
                makeRow(),
                makeRow({
                    id: 'e-2',
                    employeeCode: 'EMP-0002',
                    fullName: 'Sara Silva',
                    nic: '199912345678',
                    contactPhone: '+94780000000',
                }),
            ],
            total: 2,
            limit: 20,
            offset: 0,
        };
        listMock.mockResolvedValue(response);
        renderTable();
        await waitFor(() =>
            expect(screen.getByText('Nimal Perera')).toBeInTheDocument(),
        );
        expect(screen.getByText('EMP-0001')).toBeInTheDocument();
        expect(screen.getAllByText('Cashier').length).toBeGreaterThan(0);
        expect(screen.getByText('200012345678')).toBeInTheDocument();
        expect(screen.getByText('+94770000000')).toBeInTheDocument();
        expect(screen.getByText('Sara Silva')).toBeInTheDocument();
    });

    it('renders the appropriate status badge per row', async () => {
        const response: IEmployeesListResponse = {
            rows: [
                makeRow({ status: 'Active' }),
                makeRow({
                    id: 'e-2',
                    employeeCode: 'EMP-0002',
                    fullName: 'Sara Silva',
                    status: 'OnLeave',
                }),
                makeRow({
                    id: 'e-3',
                    employeeCode: 'EMP-0003',
                    fullName: 'Bob Cruz',
                    status: 'Terminated',
                }),
            ],
            total: 3,
            limit: 20,
            offset: 0,
        };
        listMock.mockResolvedValue(response);
        renderTable();
        await waitFor(() =>
            expect(screen.getByText('Active')).toBeInTheDocument(),
        );
        expect(screen.getByText('On leave')).toBeInTheDocument();
        expect(screen.getByText('Terminated')).toBeInTheDocument();
    });

    it('shows the empty state when no rows are returned', async () => {
        listMock.mockResolvedValue({
            rows: [],
            total: 0,
            limit: 20,
            offset: 0,
        });
        renderTable();
        await waitFor(() =>
            expect(screen.getByText(/no employees yet/i)).toBeInTheDocument(),
        );
    });
});
