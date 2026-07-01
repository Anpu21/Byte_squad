import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PosLoyaltyCard } from '../PosLoyaltyCard';
import { loyaltyService } from '@/services/loyalty.service';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';
import type { ILoyaltyLookupResult } from '@/types';

vi.mock('@/services/loyalty.service', () => ({
    loyaltyService: {
        lookupByPhone: vi.fn(),
        enrollWalkInCustomer: vi.fn(),
    },
}));

const lookupMock = vi.mocked(loyaltyService.lookupByPhone);
const enrollMock = vi.mocked(loyaltyService.enrollWalkInCustomer);

const hitResult: ILoyaltyLookupResult = {
    ownerType: 'user',
    userId: 'u-1',
    loyaltyCustomerId: null,
    tier: 'bronze',
    firstName: 'Nimal',
    lastName: 'Perera',
    phone: '+94770000001',
    pointsBalance: 250,
    lifetimePointsEarned: 400,
    lifetimePointsRedeemed: 150,
};

const enrolledResult: ILoyaltyLookupResult = {
    ownerType: 'walkIn',
    userId: null,
    loyaltyCustomerId: 'lc-1',
    tier: 'bronze',
    firstName: 'Sunil',
    lastName: null,
    phone: '+94770000002',
    pointsBalance: 0,
    lifetimePointsEarned: 0,
    lifetimePointsRedeemed: 0,
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

interface IHostState {
    owner: IPosLoyaltyOwner | null;
    redeemPoints: number;
}

function CardHost({
    initialOwner = null,
    initialRedeem = 0,
}: {
    initialOwner?: IPosLoyaltyOwner | null;
    initialRedeem?: number;
}) {
    const [state, setState] = useState<IHostState>({
        owner: initialOwner,
        redeemPoints: initialRedeem,
    });
    return (
        <PosLoyaltyCard
            loyaltyOwner={state.owner}
            onAttach={(owner) =>
                setState((prev) => ({ ...prev, owner }))
            }
            onDetach={() =>
                setState((prev) => ({ ...prev, owner: null }))
            }
            redeemPoints={state.redeemPoints}
            onRedeemChange={(redeemPoints) =>
                setState((prev) => ({ ...prev, redeemPoints }))
            }
        />
    );
}

function renderHost(overrides: {
    initialOwner?: IPosLoyaltyOwner | null;
    initialRedeem?: number;
} = {}) {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={client}>
            <CardHost {...overrides} />
        </QueryClientProvider>,
    );
}

describe('PosLoyaltyCard', () => {
    beforeEach(() => {
        lookupMock.mockReset();
        enrollMock.mockReset();
    });

    it('shows the phone field in the idle state', () => {
        renderHost();
        expect(
            screen.getByLabelText(/Loyalty member phone/i),
        ).toBeInTheDocument();
        expect(screen.queryByText('Nimal')).not.toBeInTheDocument();
    });

    it('renders the hit state with name + balance after a successful lookup', async () => {
        lookupMock.mockResolvedValueOnce(hitResult);
        renderHost();
        const phoneInput = screen.getByLabelText(/Loyalty member phone/i);
        await userEvent.type(phoneInput, '+94770000001');
        await waitFor(() => expect(lookupMock).toHaveBeenCalled());
        await screen.findByText('Nimal');
        expect(screen.getByText(/Bronze.*Registered/)).toBeInTheDocument();
        expect(screen.getByText('250')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /detach loyalty/i }),
        ).toBeInTheDocument();
    });

    it('shows the inline enrol form on 404 and transitions to hit after enrolment', async () => {
        lookupMock.mockRejectedValueOnce(makeAxios404());
        enrollMock.mockResolvedValueOnce(enrolledResult);
        renderHost();
        const phoneInput = screen.getByLabelText(/Loyalty member phone/i);
        await userEvent.type(phoneInput, '+94770000002');

        // Miss state surfaces the enrol form.
        await screen.findByRole('form', { name: /enrol walk-in customer/i });
        const firstName = screen.getByLabelText('First name');
        await userEvent.type(firstName, 'Sunil');
        const lastName = screen.getByLabelText('Last name');
        await userEvent.type(lastName, 'Fernando');

        const submit = screen.getByRole('button', { name: /^Enrol/ });
        await userEvent.click(submit);

        await waitFor(() => {
            expect(enrollMock).toHaveBeenCalledWith({
                phone: '+94770000002',
                firstName: 'Sunil',
                lastName: 'Fernando',
            });
        });
        await screen.findByText('Sunil');
        expect(screen.getByText(/Bronze.*Walk-in/)).toBeInTheDocument();
    });

    it('clears the attached owner when Clear is clicked', async () => {
        renderHost({
            initialOwner: {
                ownerType: 'user',
                userId: 'u-1',
                loyaltyCustomerId: null,
                tier: 'bronze',
                firstName: 'Nimal',
                pointsBalance: 250,
            },
        });
        await screen.findByText('Nimal');
        const clearBtn = screen.getByRole('button', {
            name: /detach loyalty/i,
        });
        await userEvent.click(clearBtn);
        await waitFor(() => {
            expect(screen.queryByText('Nimal')).not.toBeInTheDocument();
        });
        // Phone field returns.
        expect(
            screen.getByLabelText(/Loyalty member phone/i),
        ).toBeInTheDocument();
    });

    it('shows a backend BadRequest message on enrol failure', async () => {
        lookupMock.mockRejectedValueOnce(makeAxios404());
        const enrollErr = new AxiosError(
            'Bad',
            '400',
            undefined,
            undefined,
            {
                status: 400,
                data: { message: 'Phone already registered' },
                statusText: 'Bad Request',
                headers: {},
                config: { headers: new AxiosHeaders() },
            },
        );
        enrollMock.mockRejectedValueOnce(enrollErr);
        renderHost();
        const phoneInput = screen.getByLabelText(/Loyalty member phone/i);
        await userEvent.type(phoneInput, '+94770000010');
        await screen.findByRole('form', { name: /enrol walk-in customer/i });
        const firstName = screen.getByLabelText('First name');
        await userEvent.type(firstName, 'Test');
        const lastName = screen.getByLabelText('Last name');
        await userEvent.type(lastName, 'User');
        const submit = screen.getByRole('button', { name: /^Enrol/ });
        await userEvent.click(submit);
        await screen.findByText('Phone already registered');
    });

    it('shows a muted SL-phone hint for an invalid number and skips lookup', async () => {
        renderHost();
        const phoneInput = screen.getByLabelText(/Loyalty member phone/i);
        await userEvent.type(phoneInput, '12');

        await screen.findByText(/Sri Lanka phone number/i);
        expect(lookupMock).not.toHaveBeenCalled();
        // No enrol form for an incomplete number.
        expect(
            screen.queryByRole('form', { name: /enrol walk-in customer/i }),
        ).not.toBeInTheDocument();
    });
});
