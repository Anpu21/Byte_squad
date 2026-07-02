import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReturnsListPage } from '../useReturnsListPage';
import { returnsService } from '@/services/returns.service';
import { adminService } from '@/services/admin.service';
import { UserRole } from '@/constants/enums';
import type { IPaginatedSalesReturns, IUser } from '@/types';

vi.mock('@/services/returns.service', () => ({
    returnsService: { list: vi.fn() },
}));
vi.mock('@/services/admin.service', () => ({
    adminService: { listBranches: vi.fn() },
}));

const roleHolder: { role: UserRole } = { role: UserRole.ADMIN };

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => {
        const u: IUser = {
            id: 'user-1',
            email: 'user@ledgerpro.dev',
            firstName: 'Sam',
            lastName: 'Tester',
            avatarUrl: null,
            role: roleHolder.role,
            branchId: 'branch-1',
            phone: null,
            address: null,
            isFirstLogin: false,
            isVerified: true,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        };
        return { user: u, isAuthenticated: true, isLoading: false };
    },
}));

const listMock = vi.mocked(returnsService.list);
const branchesMock = vi.mocked(adminService.listBranches);

const emptyPage: IPaginatedSalesReturns = {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
};

function makeWrapper() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return Wrapper;
}

describe('useReturnsListPage', () => {
    beforeEach(() => {
        listMock.mockReset();
        branchesMock.mockReset();
        listMock.mockResolvedValue(emptyPage);
        branchesMock.mockResolvedValue([]);
        roleHolder.role = UserRole.ADMIN;
    });

    it('sends the admin branch filter and loads branch options', async () => {
        const { result } = renderHook(() => useReturnsListPage(), {
            wrapper: makeWrapper(),
        });
        await waitFor(() => expect(listMock).toHaveBeenCalled());
        expect(result.current.isAdmin).toBe(true);
        expect(branchesMock).toHaveBeenCalled();

        act(() => result.current.setBranchId('b-2'));
        await waitFor(() =>
            expect(listMock).toHaveBeenLastCalledWith(
                expect.objectContaining({ branchId: 'b-2' }),
            ),
        );
    });

    it('never sends a branch filter for a cashier (auto-scoped by the API)', async () => {
        roleHolder.role = UserRole.CASHIER;
        const { result } = renderHook(() => useReturnsListPage(), {
            wrapper: makeWrapper(),
        });
        await waitFor(() => expect(listMock).toHaveBeenCalled());
        expect(result.current.isCashier).toBe(true);
        expect(branchesMock).not.toHaveBeenCalled();

        act(() => result.current.setBranchId('b-2'));
        await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));
        expect(listMock).toHaveBeenLastCalledWith(
            expect.objectContaining({ branchId: undefined }),
        );
    });

    it('debounces the invoice search into the query params', async () => {
        const { result } = renderHook(() => useReturnsListPage(), {
            wrapper: makeWrapper(),
        });
        await waitFor(() => expect(listMock).toHaveBeenCalled());

        act(() => result.current.setSearch('INV-9'));
        await waitFor(() =>
            expect(listMock).toHaveBeenLastCalledWith(
                expect.objectContaining({ search: 'INV-9' }),
            ),
        );
    });
});
