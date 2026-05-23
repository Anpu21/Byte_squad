import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PosInformationBox } from '../PosInformationBox';
import { profileService } from '@/services/profile.service';
import { posService } from '@/services/pos.service';
import { UserRole } from '@/constants/enums';
import type { IUser, IUserProfile, IBranch } from '@/types';

vi.mock('@/services/profile.service', () => ({
    profileService: {
        getProfile: vi.fn(),
    },
}));
vi.mock('@/services/pos.service', () => ({
    posService: {
        previewInvoiceNumber: vi.fn(),
    },
}));

const userFixture: IUser = {
    id: 'user-1',
    email: 'cashier@ledgerpro.dev',
    firstName: 'Alex',
    lastName: 'Pereira',
    avatarUrl: null,
    role: UserRole.CASHIER,
    branchId: 'branch-1',
    phone: null,
    address: null,
    isFirstLogin: false,
    isVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
};

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: userFixture,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
    }),
}));

const profileMock = vi.mocked(profileService.getProfile);
const invoiceMock = vi.mocked(posService.previewInvoiceNumber);

const branchFixture: IBranch = {
    id: 'branch-1',
    code: 'COLO',
    name: 'Colombo Main',
    addressLine1: '1 Marine Drive',
    addressLine2: null,
    city: 'Colombo',
    state: null,
    country: 'LK',
    postalCode: '00100',
    phone: '+94110000000',
    email: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
};

const profileFixture: IUserProfile = {
    ...userFixture,
    branch: branchFixture,
};

function renderBox() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    render(<PosInformationBox />, { wrapper: Wrapper });
}

describe('PosInformationBox', () => {
    beforeEach(() => {
        profileMock.mockReset();
        invoiceMock.mockReset();
    });

    it('renders cashier name, branch, and a date label', async () => {
        profileMock.mockResolvedValueOnce(profileFixture);
        invoiceMock.mockResolvedValueOnce({ invoiceNo: 'INV-2026-000123' });
        renderBox();

        expect(screen.getByText('Alex Pereira')).toBeInTheDocument();
        // Branch is fetched async — wait for it to settle.
        expect(
            await screen.findByText('Colombo Main'),
        ).toBeInTheDocument();
        // The "Today" label is always present, regardless of locale.
        expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('renders the previewed next invoice number', async () => {
        profileMock.mockResolvedValueOnce(profileFixture);
        invoiceMock.mockResolvedValueOnce({ invoiceNo: 'INV-2026-000123' });
        renderBox();

        // The placeholder shows until the query resolves; assert the resolved
        // value lands in the DOM.
        await waitFor(() =>
            expect(
                screen.getByText('INV-2026-000123'),
            ).toBeInTheDocument(),
        );
    });

    it('falls back to a placeholder for the invoice number when the preview fails', async () => {
        profileMock.mockResolvedValueOnce(profileFixture);
        invoiceMock.mockRejectedValueOnce(new Error('preview-fail'));
        renderBox();

        // Placeholder stays in place when the query rejects — no crash.
        await waitFor(() =>
            expect(screen.getByText(/INV-…/)).toBeInTheDocument(),
        );
    });
});
