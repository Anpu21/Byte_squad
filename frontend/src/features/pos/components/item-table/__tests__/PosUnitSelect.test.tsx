import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IProductUnitRow } from '@/types';
import { PosUnitSelect } from '../PosUnitSelect';
import { posService } from '@/services/pos.service';

vi.mock('@/services/pos.service', () => ({
    posService: {
        listProductUnits: vi.fn(),
    },
}));

const listMock = vi.mocked(posService.listProductUnits);

const baseUnit: IProductUnitRow = {
    unitId: 'u-base',
    unitName: 'kg',
    barcode: null,
    isBaseUnit: true,
    conversionToBase: 1,
    sellingPrice: 1200,
    displayOrder: 0,
};

const secondaryUnit: IProductUnitRow = {
    unitId: 'u-pack',
    unitName: '12-PACK',
    barcode: 'RICE-12',
    isBaseUnit: false,
    conversionToBase: 12,
    sellingPrice: 2200,
    displayOrder: 1,
};

function makeWrapper() {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
        },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { Wrapper };
}

describe('PosUnitSelect', () => {
    beforeEach(() => {
        listMock.mockReset();
    });

    it('renders fetched units as options', async () => {
        listMock.mockResolvedValueOnce([baseUnit, secondaryUnit]);
        const { Wrapper } = makeWrapper();

        render(
            <PosUnitSelect
                productId="p-1"
                value="u-base"
                onChange={vi.fn()}
            />,
            { wrapper: Wrapper },
        );

        await waitFor(() =>
            expect(screen.getByRole('combobox')).not.toBeDisabled(),
        );
        // Both options present (base annotated with "(base)")
        expect(
            screen.getByRole('option', { name: 'kg (base)' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: '12-PACK' }),
        ).toBeInTheDocument();
    });

    it('emits the selected unit on change', async () => {
        listMock.mockResolvedValueOnce([baseUnit, secondaryUnit]);
        const onChange = vi.fn();
        const { Wrapper } = makeWrapper();

        render(
            <PosUnitSelect
                productId="p-1"
                value="u-base"
                onChange={onChange}
            />,
            { wrapper: Wrapper },
        );

        await waitFor(() =>
            expect(screen.getByRole('combobox')).not.toBeDisabled(),
        );
        await userEvent.selectOptions(
            screen.getByRole('combobox'),
            screen.getByRole('option', { name: '12-PACK' }),
        );
        expect(onChange).toHaveBeenCalledWith(secondaryUnit);
    });

    it('stays disabled while productId is null', () => {
        const { Wrapper } = makeWrapper();
        render(
            <PosUnitSelect
                productId={null}
                value={null}
                onChange={vi.fn()}
            />,
            { wrapper: Wrapper },
        );
        expect(screen.getByRole('combobox')).toBeDisabled();
        expect(listMock).not.toHaveBeenCalled();
    });
});
