import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PosCustomerPickerModal } from '../PosCustomerPickerModal';
import { posService } from '@/services/pos.service';
import type { ICustomerSearchRow } from '@/types';

vi.mock('@/services/pos.service', () => ({
    posService: {
        searchCustomers: vi.fn(),
    },
}));

const searchMock = vi.mocked(posService.searchCustomers);

const sample: ICustomerSearchRow = {
    userId: 'cust-1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '+94770000001',
    currentBalance: 250,
};

function renderPicker(props: Partial<{
    isOpen: boolean;
    onClose: ReturnType<typeof vi.fn>;
    onSelect: ReturnType<typeof vi.fn>;
}> = {}) {
    const onClose = props.onClose ?? vi.fn();
    const onSelect = props.onSelect ?? vi.fn();
    const isOpen = props.isOpen ?? true;
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    render(
        <PosCustomerPickerModal
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            // Reduce debounce in tests so we don't have to push fake timers
            // through the React Query enabled-gate.
            debounceMs={0}
        />,
        { wrapper: Wrapper },
    );
    return { onClose, onSelect };
}

describe('PosCustomerPickerModal', () => {
    beforeEach(() => {
        searchMock.mockReset();
        searchMock.mockResolvedValue([]);
    });

    it('renders a Walk-in option that emits onSelect(null)', async () => {
        const { onSelect } = renderPicker();
        const walkIn = screen.getByRole('button', {
            name: /walk-in.*no customer/i,
        });
        await userEvent.click(walkIn);
        expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('shows the empty-prompt message until the user types', () => {
        renderPicker();
        expect(
            screen.getByText(/start typing to find a customer/i),
        ).toBeInTheDocument();
    });

    it('searches and emits the picked customer row', async () => {
        // Each debounced keystroke fires a fresh query — return the row
        // for any non-empty term so the final settled query resolves it.
        searchMock.mockResolvedValue([sample]);
        const { onSelect } = renderPicker();
        const input = screen.getByLabelText(/search customers/i);
        await userEvent.type(input, 'j');
        const row = await screen.findByRole(
            'option',
            { name: /Jane Doe/i },
            { timeout: 3000 },
        );
        await userEvent.click(row);
        expect(onSelect).toHaveBeenCalledWith(sample);
        await waitFor(() =>
            expect(searchMock).toHaveBeenCalledWith('j', 10),
        );
    });

    it('surfaces an empty-results message for a non-matching query', async () => {
        searchMock.mockResolvedValue([]);
        renderPicker();
        const input = screen.getByLabelText(/search customers/i);
        await userEvent.type(input, 'z');
        await waitFor(
            () => expect(searchMock).toHaveBeenCalledWith('z', 10),
            { timeout: 3000 },
        );
        expect(
            await screen.findByText(/no customers matched/i),
        ).toBeInTheDocument();
    });
});
