import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type PropsWithChildren, type ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PosCustomerInfo } from '../PosCustomerInfo';
import { posService } from '@/services/pos.service';
import type { ICustomerSearchRow } from '@/types';

vi.mock('@/services/pos.service', () => ({
    posService: {
        searchCustomers: vi.fn(),
    },
}));

const confirmMock = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
    useConfirm: () => confirmMock,
}));

// Stub the picker modal so the info component's tests don't need to drive
// the debounced search to attach a customer. The modal's own behavior is
// covered in PosCustomerPickerModal.test.tsx; here we only verify that
// PosCustomerInfo wires the picker's onSelect callback to onPick + the
// local snapshot, and that the detach path goes through useConfirm.
vi.mock('../PosCustomerPickerModal', () => ({
    PosCustomerPickerModal: ({
        isOpen,
        onSelect,
    }: {
        isOpen: boolean;
        onSelect: (row: ICustomerSearchRow | null) => void;
        onClose: () => void;
    }) =>
        isOpen ? (
            <div role="dialog" aria-label="Attach customer">
                <button
                    type="button"
                    onClick={() =>
                        onSelect({
                            userId: 'cust-1',
                            firstName: 'Jane',
                            lastName: 'Doe',
                            email: 'jane@example.com',
                            phone: '+94770000001',
                            currentBalance: 50,
                        })
                    }
                >
                    pick-jane
                </button>
                <button type="button" onClick={() => onSelect(null)}>
                    pick-walkin
                </button>
            </div>
        ) : null,
}));

const searchMock = vi.mocked(posService.searchCustomers);

function renderInfo(
    initialCustomerId: string | null = null,
    onPickSpy: ReturnType<typeof vi.fn<(userId: string | null) => void>> = vi.fn<(userId: string | null) => void>(),
) {
    // Lift state in the test so the component sees a parent-owned
    // customerUserId update when its `onPick` fires — without this, the
    // safety effect that drops the snapshot when the parent forces a null
    // would immediately undo a fresh selection.
    function Harness() {
        const [customerUserId, setCustomerUserId] = useState<string | null>(
            initialCustomerId,
        );
        return (
            <PosCustomerInfo
                customerUserId={customerUserId}
                onPick={(next) => {
                    setCustomerUserId(next);
                    onPickSpy(next);
                }}
            />
        );
    }

    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    render(<Harness />, { wrapper: Wrapper });
    return { onPick: onPickSpy };
}

describe('PosCustomerInfo', () => {
    beforeEach(() => {
        searchMock.mockReset();
        confirmMock.mockReset();
        searchMock.mockResolvedValue([]);
    });

    it('renders the walk-in pill and an attach button when no customer is set', () => {
        renderInfo(null);
        expect(screen.getByText('Walk-in customer')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /attach customer/i }),
        ).toBeInTheDocument();
    });

    it('opens the picker modal when the attach button is clicked', async () => {
        renderInfo(null);
        await userEvent.click(
            screen.getByRole('button', { name: /attach customer/i }),
        );
        // The picker modal mounts its title — assert it surfaces.
        expect(
            screen.getByRole('dialog', { name: /attach customer/i }),
        ).toBeInTheDocument();
    });

    it('forwards the picker selection to onPick and shows the customer snapshot', async () => {
        const onPick = vi.fn();
        renderInfo(null, onPick);
        await userEvent.click(
            screen.getByRole('button', { name: /attach customer/i }),
        );
        // Stubbed picker exposes a "pick-jane" button.
        await userEvent.click(
            screen.getByRole('button', { name: 'pick-jane' }),
        );
        expect(onPick).toHaveBeenLastCalledWith('cust-1');
        // Snapshot UI surfaces the customer name and a Change / Detach pair.
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /detach customer/i }),
        ).toBeInTheDocument();
    });

    it('confirms before detaching and emits onPick(null) when confirmed', async () => {
        confirmMock.mockResolvedValueOnce(true);
        const onPick = vi.fn();
        renderInfo(null, onPick);
        await userEvent.click(
            screen.getByRole('button', { name: /attach customer/i }),
        );
        await userEvent.click(
            screen.getByRole('button', { name: 'pick-jane' }),
        );
        onPick.mockClear();

        await userEvent.click(
            screen.getByRole('button', { name: /detach customer/i }),
        );
        expect(confirmMock).toHaveBeenCalledTimes(1);
        expect(onPick).toHaveBeenLastCalledWith(null);
    });

    it('does not detach when the confirm prompt is dismissed', async () => {
        confirmMock.mockResolvedValueOnce(false);
        const onPick = vi.fn();
        renderInfo(null, onPick);
        await userEvent.click(
            screen.getByRole('button', { name: /attach customer/i }),
        );
        await userEvent.click(
            screen.getByRole('button', { name: 'pick-jane' }),
        );
        onPick.mockClear();

        await userEvent.click(
            screen.getByRole('button', { name: /detach customer/i }),
        );
        expect(confirmMock).toHaveBeenCalledTimes(1);
        // onPick was NOT called again — detach was cancelled, so the
        // snapshot persists.
        expect(onPick).not.toHaveBeenCalled();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
});
