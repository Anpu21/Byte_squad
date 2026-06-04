import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { usePosLoyaltyLookup } from '../usePosLoyaltyLookup';
import { loyaltyService } from '@/services/loyalty.service';
import type { ILoyaltyLookupResult } from '@/types';
import { makeWrapper } from './test-utils';

vi.mock('@/services/loyalty.service', () => ({
    loyaltyService: {
        lookupByPhone: vi.fn(),
    },
}));

const lookupMock = vi.mocked(loyaltyService.lookupByPhone);

const hit: ILoyaltyLookupResult = {
    ownerType: 'user',
    userId: 'u-1',
    loyaltyCustomerId: null,
    tier: 'bronze',
    firstName: 'Nimal',
    lastName: 'Perera',
    phone: '+94770000001',
    pointsBalance: 120,
    lifetimePointsEarned: 200,
    lifetimePointsRedeemed: 80,
};

function makeAxios404(): AxiosError {
    return new AxiosError(
        'Not found',
        '404',
        undefined,
        undefined,
        {
            status: 404,
            data: { message: 'not found' },
            statusText: 'Not Found',
            headers: {},
            config: { headers: new AxiosHeaders() },
        },
    );
}

describe('usePosLoyaltyLookup', () => {
    beforeEach(() => {
        lookupMock.mockReset();
    });

    it('does not fetch until the phone has 7+ digits', async () => {
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(() => usePosLoyaltyLookup('123'), {
            wrapper: Wrapper,
        });
        await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
        expect(lookupMock).not.toHaveBeenCalled();
    });

    it('fires the lookup once the phone hits the digit threshold', async () => {
        lookupMock.mockResolvedValueOnce(hit);
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(
            () => usePosLoyaltyLookup('+94770000001'),
            { wrapper: Wrapper },
        );
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(hit);
        expect(lookupMock).toHaveBeenCalledWith('+94770000001');
    });

    it('surfaces a 404 as data=null (no error toast)', async () => {
        lookupMock.mockRejectedValueOnce(makeAxios404());
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(
            () => usePosLoyaltyLookup('+94770000002'),
            { wrapper: Wrapper },
        );
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toBeNull();
        expect(result.current.isError).toBe(false);
    });

    it('propagates non-404 errors as isError', async () => {
        lookupMock.mockRejectedValueOnce(new Error('boom'));
        const { Wrapper } = makeWrapper();
        const { result } = renderHook(
            () => usePosLoyaltyLookup('+94770000003'),
            { wrapper: Wrapper },
        );
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect((result.current.error as Error).message).toBe('boom');
    });
});
