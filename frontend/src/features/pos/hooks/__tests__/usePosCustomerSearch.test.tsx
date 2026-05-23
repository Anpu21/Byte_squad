import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePosCustomerSearch } from '../usePosCustomerSearch';
import { posService } from '@/services/pos.service';
import type { ICustomerSearchRow } from '@/types';
import { makeWrapper } from './test-utils';

vi.mock('@/services/pos.service', () => ({
    posService: {
        searchCustomers: vi.fn(),
    },
}));

const searchMock = vi.mocked(posService.searchCustomers);

const customer: ICustomerSearchRow = {
    userId: 'cust-1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '+94770000001',
    currentBalance: 250.5,
};

describe('usePosCustomerSearch', () => {
    beforeEach(() => {
        searchMock.mockReset();
    });

    it('fetches customers when the query is non-empty', async () => {
        searchMock.mockResolvedValueOnce([customer]);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosCustomerSearch('ja', 5), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([customer]);
        expect(searchMock).toHaveBeenCalledWith('ja', 5);
    });

    it('does not fetch while the trimmed query is empty', async () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosCustomerSearch('   ', 10), {
            wrapper: Wrapper,
        });
        // Wait a microtask so any spurious fetch would have fired.
        await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
        expect(searchMock).not.toHaveBeenCalled();
    });

    it('surfaces an error when the search rejects', async () => {
        searchMock.mockRejectedValueOnce(new Error('lookup-fail'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosCustomerSearch('z'), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('lookup-fail');
    });
});
