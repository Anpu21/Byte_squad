import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { LoyaltyCustomersFilters } from '../LoyaltyCustomersFilters';

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
            <QueryClientProvider client={client}>
                {children}
            </QueryClientProvider>
        );
    }
    return { Wrapper, client };
}

interface IFilterProps {
    searchDraft?: string;
    branchId?: string;
    activeSince?: string;
    minPoints?: string;
    maxPoints?: string;
    onSearchDraftChange?: (v: string) => void;
    onBranchIdChange?: (v: string) => void;
    onActiveSinceChange?: (v: string) => void;
    onPointsRangeChange?: (min: string, max: string) => void;
}

function renderFilters(overrides: IFilterProps = {}) {
    const { Wrapper } = makeWrapper();
    const onSearchDraftChange = overrides.onSearchDraftChange ?? vi.fn();
    const onBranchIdChange = overrides.onBranchIdChange ?? vi.fn();
    const onActiveSinceChange = overrides.onActiveSinceChange ?? vi.fn();
    const onPointsRangeChange = overrides.onPointsRangeChange ?? vi.fn();
    render(
        <Wrapper>
            <LoyaltyCustomersFilters
                searchDraft={overrides.searchDraft ?? ''}
                onSearchDraftChange={onSearchDraftChange}
                branchId={overrides.branchId ?? ''}
                onBranchIdChange={onBranchIdChange}
                activeSince={overrides.activeSince ?? ''}
                onActiveSinceChange={onActiveSinceChange}
                minPoints={overrides.minPoints ?? ''}
                maxPoints={overrides.maxPoints ?? ''}
                onPointsRangeChange={onPointsRangeChange}
            />
        </Wrapper>,
    );
    return {
        onSearchDraftChange,
        onBranchIdChange,
        onActiveSinceChange,
        onPointsRangeChange,
    };
}

describe('LoyaltyCustomersFilters', () => {
    beforeEach(() => {
        vi.mocked(adminService.listBranches).mockResolvedValue([
            {
                id: 'b1',
                name: 'Colombo',
                code: 'CMB',
                address: 'Main St',
                phone: '+94110000000',
                productCount: 0,
                staffCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'b2',
                name: 'Kandy',
                code: 'KND',
                address: 'Hill St',
                phone: '+94810000000',
                productCount: 0,
                staffCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ] as never);
    });

    it('renders the search box, branch select, date input, and points range', () => {
        renderFilters();
        expect(
            screen.getByLabelText(/search loyalty customers/i),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/filter by branch/i)).toBeInTheDocument();
        expect(
            screen.getByLabelText(/filter by activity date/i),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/minimum points/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/maximum points/i)).toBeInTheDocument();
    });

    it('fires onSearchDraftChange when the search field changes', async () => {
        const onSearchDraftChange = vi.fn();
        renderFilters({ onSearchDraftChange });
        await userEvent.type(
            screen.getByLabelText(/search loyalty customers/i),
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

    it('rejects non-numeric keystrokes on the points range inputs', async () => {
        const onPointsRangeChange = vi.fn();
        renderFilters({ onPointsRangeChange });
        await userEvent.type(
            screen.getByLabelText(/minimum points/i),
            'abc',
        );
        expect(onPointsRangeChange).not.toHaveBeenCalled();
    });

    it('clearing a populated points range fires onPointsRangeChange with empty strings', async () => {
        const onPointsRangeChange = vi.fn();
        renderFilters({
            minPoints: '10',
            maxPoints: '100',
            onPointsRangeChange,
        });
        await userEvent.click(
            screen.getByRole('button', { name: /clear points range/i }),
        );
        expect(onPointsRangeChange).toHaveBeenCalledWith('', '');
    });
});
