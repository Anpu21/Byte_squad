import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PosLoyaltyHitBody } from '../PosLoyaltyHitBody';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';

const owner: IPosLoyaltyOwner = {
    ownerType: 'walkIn',
    userId: null,
    loyaltyCustomerId: 'lc-1',
    tier: 'bronze',
    firstName: 'Nimal',
    pointsBalance: 50,
};

describe('PosLoyaltyHitBody', () => {
    it('shows the disabled reason when the redeem cap is 0', () => {
        render(
            <PosLoyaltyHitBody
                owner={owner}
                redeemPoints={0}
                onRedeemChange={vi.fn()}
                maxRedeemable={0}
                redeemDisabledReason="Needs 100+ points to redeem (has 50)."
            />,
        );
        expect(
            screen.getByText(/Needs 100\+ points to redeem/),
        ).toBeInTheDocument();
    });

    it('shows the redeem cap and no reason when redemption is available', () => {
        render(
            <PosLoyaltyHitBody
                owner={{ ...owner, pointsBalance: 500 }}
                redeemPoints={0}
                onRedeemChange={vi.fn()}
                maxRedeemable={200}
                redeemDisabledReason={null}
            />,
        );
        expect(screen.getByText('Redeem up to 200')).toBeInTheDocument();
        expect(screen.queryByText(/Needs .* points/)).not.toBeInTheDocument();
    });
});
