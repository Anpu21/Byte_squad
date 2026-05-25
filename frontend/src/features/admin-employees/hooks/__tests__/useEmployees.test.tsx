import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployees } from '../useEmployees';
import { hrService } from '@/services/hr.service';
import type { IEmployeesListResponse } from '@/types';

vi.mock('@/services/hr.service', () => ({
    hrService: {
        listEmployees: vi.fn(),
    },
}));

const listMock = vi.mocked(hrService.listEmployees);

function makeWrapper() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { Wrapper };
}

const empty: IEmployeesListResponse = {
    rows: [],
    total: 0,
    limit: 20,
    offset: 0,
};

describe('useEmployees', () => {
    beforeEach(() => {
        listMock.mockReset();
        listMock.mockResolvedValue(empty);
    });

    it('forwards trimmed search and branch params to the service', async () => {
        const { Wrapper } = makeWrapper();
        renderHook(
            () =>
                useEmployees({
                    search: '  jane  ',
                    branchId: 'b-1',
                    status: 'Active',
                    limit: 20,
                    offset: 0,
                }),
            { wrapper: Wrapper },
        );
        await waitFor(() => expect(listMock).toHaveBeenCalled());
        expect(listMock).toHaveBeenCalledWith({
            search: 'jane',
            branchId: 'b-1',
            status: 'Active',
            limit: 20,
            offset: 0,
        });
    });

    it('strips empty string filters from the wire params', async () => {
        const { Wrapper } = makeWrapper();
        renderHook(
            () =>
                useEmployees({
                    search: '',
                    branchId: '',
                    limit: 20,
                    offset: 0,
                }),
            { wrapper: Wrapper },
        );
        await waitFor(() => expect(listMock).toHaveBeenCalled());
        const args = listMock.mock.calls[0]?.[0];
        expect(args).toEqual({
            search: undefined,
            branchId: undefined,
            status: undefined,
            limit: 20,
            offset: 0,
        });
    });
});
