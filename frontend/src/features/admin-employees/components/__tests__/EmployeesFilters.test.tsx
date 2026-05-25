import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { EmployeesFilters } from '../EmployeesFilters';

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

interface IFilterProps {
    searchDraft?: string;
    branchId?: string;
    status?: '' | 'Active' | 'Resigned' | 'Terminated' | 'OnLeave';
    canPickBranch?: boolean;
    onSearchDraftChange?: (v: string) => void;
    onBranchIdChange?: (v: string) => void;
    onStatusChange?: (
        v: '' | 'Active' | 'Resigned' | 'Terminated' | 'OnLeave',
    ) => void;
}

function renderFilters(overrides: IFilterProps = {}) {
    const { Wrapper } = makeWrapper();
    const onSearchDraftChange = overrides.onSearchDraftChange ?? vi.fn();
    const onBranchIdChange = overrides.onBranchIdChange ?? vi.fn();
    const onStatusChange = overrides.onStatusChange ?? vi.fn();
    render(
        <Wrapper>
            <EmployeesFilters
                searchDraft={overrides.searchDraft ?? ''}
                onSearchDraftChange={onSearchDraftChange}
                branchId={overrides.branchId ?? ''}
                onBranchIdChange={onBranchIdChange}
                status={overrides.status ?? ''}
                onStatusChange={onStatusChange}
                canPickBranch={overrides.canPickBranch ?? true}
            />
        </Wrapper>,
    );
    return { onSearchDraftChange, onBranchIdChange, onStatusChange };
}

describe('EmployeesFilters', () => {
    beforeEach(() => {
        vi.mocked(adminService.listBranches).mockResolvedValue([
            {
                id: 'b1',
                name: 'Colombo',
                code: 'CMB',
                addressLine1: 'Main St',
                addressLine2: null,
                city: null,
                state: null,
                country: null,
                postalCode: null,
                phone: '+94110000000',
                email: null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                managerName: null,
                managerEmail: null,
                staffCount: 0,
            },
            {
                id: 'b2',
                name: 'Kandy',
                code: 'KND',
                addressLine1: 'Hill St',
                addressLine2: null,
                city: null,
                state: null,
                country: null,
                postalCode: null,
                phone: '+94810000000',
                email: null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                managerName: null,
                managerEmail: null,
                staffCount: 0,
            },
        ]);
    });

    it('renders the search box, branch select, and status select', async () => {
        renderFilters();
        expect(screen.getByLabelText(/search employees/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/filter by branch/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
    });

    it('fires onSearchDraftChange when the search field changes', async () => {
        const onSearchDraftChange = vi.fn();
        renderFilters({ onSearchDraftChange });
        await userEvent.type(
            screen.getByLabelText(/search employees/i),
            'jane',
        );
        expect(onSearchDraftChange).toHaveBeenCalled();
    });

    it('fires onBranchIdChange when a branch is picked', async () => {
        const onBranchIdChange = vi.fn();
        renderFilters({ onBranchIdChange });
        await screen.findByRole('option', { name: 'Kandy' });
        await userEvent.selectOptions(
            screen.getByLabelText(/filter by branch/i),
            'b2',
        );
        expect(onBranchIdChange).toHaveBeenCalledWith('b2');
    });

    it('fires onStatusChange when a status is picked', async () => {
        const onStatusChange = vi.fn();
        renderFilters({ onStatusChange });
        await userEvent.selectOptions(
            screen.getByLabelText(/filter by status/i),
            'Terminated',
        );
        expect(onStatusChange).toHaveBeenCalledWith('Terminated');
    });

    it('hides the branch select when canPickBranch is false (managers)', () => {
        renderFilters({ canPickBranch: false });
        expect(screen.queryByLabelText(/filter by branch/i)).toBeNull();
    });

    it('shows the clear button only when search has a value', async () => {
        const onSearchDraftChange = vi.fn();
        const { rerender } = render(
            <QueryClientProvider
                client={
                    new QueryClient({
                        defaultOptions: {
                            queries: { retry: false, gcTime: 0 },
                        },
                    })
                }
            >
                <EmployeesFilters
                    searchDraft=""
                    onSearchDraftChange={onSearchDraftChange}
                    branchId=""
                    onBranchIdChange={vi.fn()}
                    status=""
                    onStatusChange={vi.fn()}
                    canPickBranch
                />
            </QueryClientProvider>,
        );
        expect(screen.queryByLabelText(/clear search/i)).toBeNull();

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
                <EmployeesFilters
                    searchDraft="abc"
                    onSearchDraftChange={onSearchDraftChange}
                    branchId=""
                    onBranchIdChange={vi.fn()}
                    status=""
                    onStatusChange={vi.fn()}
                    canPickBranch
                />
            </QueryClientProvider>,
        );
        await userEvent.click(screen.getByLabelText(/clear search/i));
        expect(onSearchDraftChange).toHaveBeenCalledWith('');
    });
});
