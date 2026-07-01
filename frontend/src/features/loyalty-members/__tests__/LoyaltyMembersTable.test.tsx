import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoyaltyMembersTable } from '../components/LoyaltyMembersTable';
import type { ILoyaltyCustomerRow } from '@/types';

const row: ILoyaltyCustomerRow = {
    id: 'lc-1',
    ownerType: 'walkIn',
    userId: null,
    loyaltyCustomerId: 'lc-1',
    tier: 'silver',
    firstName: 'Nimal',
    lastName: 'Perera',
    email: null,
    phone: '+94771234567',
    pointsBalance: 320,
    lifetimePointsEarned: 500,
    lifetimePointsRedeemed: 180,
    lastActivityAt: '2026-06-01T10:00:00.000Z',
    lastActivityBranchId: 'b-1',
    lastActivityBranchName: 'Main',
};

describe('LoyaltyMembersTable', () => {
    it('renders a member row and fires onOpenHistory', async () => {
        const onOpenHistory = vi.fn();
        render(
            <LoyaltyMembersTable
                rows={[row]}
                isLoading={false}
                onOpenHistory={onOpenHistory}
            />,
        );

        expect(screen.getByText('Nimal Perera')).toBeInTheDocument();
        expect(screen.getByText('+94771234567')).toBeInTheDocument();
        expect(screen.getByText('Silver')).toBeInTheDocument();
        expect(screen.getByText('320')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'History' }));
        expect(onOpenHistory).toHaveBeenCalledWith(row);
    });

    it('shows the empty state with no rows', () => {
        render(
            <LoyaltyMembersTable
                rows={[]}
                isLoading={false}
                onOpenHistory={vi.fn()}
            />,
        );
        expect(
            screen.getByText('No loyalty members yet'),
        ).toBeInTheDocument();
    });
});
