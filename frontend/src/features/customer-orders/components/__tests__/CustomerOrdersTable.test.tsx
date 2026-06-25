import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { ICustomerOrder } from '@/types';
import { CustomerOrdersTable } from '../CustomerOrdersTable';

function order(over: Partial<ICustomerOrder> = {}): ICustomerOrder {
    return {
        id: 'o1',
        orderCode: 'ORD-1',
        groupCode: null,
        userId: 'u1',
        branchId: 'b1',
        status: 'pending',
        estimatedTotal: 1000,
        loyaltyDiscountAmount: 0,
        finalTotal: 1000,
        paymentMode: 'online',
        paymentStatus: 'paid',
        loyaltyPointsRedeemed: 0,
        loyaltyPointsEarned: 0,
        guestName: null,
        note: null,
        fulfilledTransactionId: null,
        qrCodeUrl: null,
        items: [{ id: 'i1' }] as unknown as ICustomerOrder['items'],
        user: {
            firstName: 'Nim',
            lastName: 'Perera',
        } as ICustomerOrder['user'],
        createdAt: '2026-06-01T10:00:00.000Z',
        updatedAt: '2026-06-01T10:00:00.000Z',
        ...over,
    };
}

function renderRow(req: ICustomerOrder, canManage = true) {
    const onCollect = vi.fn();
    const onMarkNotCollected = vi.fn();
    render(
        <CustomerOrdersTable
            requests={[req]}
            isLoading={false}
            hasFilters={false}
            isAdmin={false}
            actionPending={false}
            search=""
            setSearch={vi.fn()}
            statusFilter=""
            setStatusFilter={vi.fn()}
            canManage={() => canManage}
            onView={vi.fn()}
            onCollect={onCollect}
            onMarkNotCollected={onMarkNotCollected}
        />,
    );
    return { onCollect, onMarkNotCollected };
}

describe('CustomerOrdersTable', () => {
    it('offers Collect + Not collected for an awaiting order (and never Accept/Reject)', () => {
        renderRow(order({ status: 'pending' }));
        expect(
            screen.getByRole('button', { name: 'Collect' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /not collected/i }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /accept/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /^reject$/i }),
        ).not.toBeInTheDocument();
        expect(
            within(screen.getByRole('table')).getByText('Awaiting pickup'),
        ).toBeInTheDocument();
    });

    it('shows a collected order with no actions and the "Collected" label', () => {
        renderRow(order({ status: 'completed' }));
        expect(
            screen.queryByRole('button', { name: 'Collect' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /not collected/i }),
        ).not.toBeInTheDocument();
        expect(
            within(screen.getByRole('table')).getByText('Collected'),
        ).toBeInTheDocument();
    });

    it('omits Collect for an online order that is not yet paid', () => {
        renderRow(order({ status: 'pending', paymentStatus: 'pending' }));
        expect(
            screen.queryByRole('button', { name: 'Collect' }),
        ).not.toBeInTheDocument();
        // A no-show can still be recorded.
        expect(
            screen.getByRole('button', { name: /not collected/i }),
        ).toBeInTheDocument();
    });

    it('hides staff actions when the user cannot manage the order', () => {
        renderRow(order({ status: 'pending' }), false);
        expect(
            screen.queryByRole('button', { name: 'Collect' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /not collected/i }),
        ).not.toBeInTheDocument();
    });
});
