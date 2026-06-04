import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTransactionsPage } from '../useTransactionsPage';
import { posService } from '@/services/pos.service';
import { UserRole } from '@/constants/enums';
import type { ICashierTransactionsSummary, IUser } from '@/types';

vi.mock('@/services/pos.service', () => ({
    posService: {
        getMyTransactions: vi.fn(),
        getAllTransactions: vi.fn(),
    },
}));

const userRoleHolder: { role: UserRole; firstName: string } = {
    role: UserRole.ADMIN,
    firstName: 'Sam',
};

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => {
        const u: IUser = {
            id: 'user-1',
            email: 'user@ledgerpro.dev',
            firstName: userRoleHolder.firstName,
            lastName: 'Tester',
            avatarUrl: null,
            role: userRoleHolder.role,
            branchId: 'branch-1',
            phone: null,
            address: null,
            isFirstLogin: false,
            isVerified: true,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        };
        return {
            user: u,
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
            login: vi.fn(),
            logout: vi.fn(),
            clearError: vi.fn(),
        };
    },
}));

const getMineMock = vi.mocked(posService.getMyTransactions);
const getAllMock = vi.mocked(posService.getAllTransactions);

const systemSummary: ICashierTransactionsSummary = {
    scope: 'system',
    today: { totalSales: 1500, transactionCount: 7 },
    month: { totalSales: 40_000, transactionCount: 200 },
    year: { totalSales: 500_000, transactionCount: 2_500 },
    recentTransactions: [
        {
            id: 't-1',
            transactionNumber: 'TX-001',
            total: 250,
            itemCount: 3,
            cashierName: 'Alice',
            branchName: 'Main',
            createdAt: '2026-05-24T10:00:00Z',
        },
    ],
};

const cashierSummary: ICashierTransactionsSummary = {
    ...systemSummary,
    scope: 'cashier',
};

function makeWrapper() {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { Wrapper, client };
}

describe('useTransactionsPage', () => {
    beforeEach(() => {
        getMineMock.mockReset();
        getAllMock.mockReset();
        userRoleHolder.role = UserRole.ADMIN;
        userRoleHolder.firstName = 'Sam';
    });

    it('admins hit getAllTransactions and surface system-scope columns', async () => {
        userRoleHolder.role = UserRole.ADMIN;
        getAllMock.mockResolvedValueOnce(systemSummary);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useTransactionsPage(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.data).toEqual(systemSummary));
        expect(getAllMock).toHaveBeenCalledTimes(1);
        expect(getMineMock).not.toHaveBeenCalled();
        expect(result.current.showBranchCol).toBe(true);
        expect(result.current.showCashierCol).toBe(true);
        expect(result.current.subtitle).toBe('All branches · 1 records');
    });

    it('non-admins hit getMyTransactions and hide both branch and cashier columns when scope is cashier', async () => {
        userRoleHolder.role = UserRole.CASHIER;
        userRoleHolder.firstName = 'Alex';
        getMineMock.mockResolvedValueOnce(cashierSummary);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => useTransactionsPage(), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.data).toEqual(cashierSummary));
        expect(getMineMock).toHaveBeenCalledTimes(1);
        expect(getAllMock).not.toHaveBeenCalled();
        expect(result.current.showBranchCol).toBe(false);
        expect(result.current.showCashierCol).toBe(false);
        expect(result.current.subtitle).toBe('Alex sales · 1 records');
    });
});
