import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductLoader } from '../useProductLoader';
import { useProductFormState } from '../useProductFormState';
import { inventoryService } from '@/services/inventory.service';
import type { IProduct } from '@/types';

vi.mock('@/services/pos.service', () => ({
    posService: { getCashierDashboard: vi.fn() },
}));

vi.mock('@/services/inventory.service', () => ({
    inventoryService: {
        getProductById: vi.fn(),
    },
}));

const getProductByIdMock = vi.mocked(inventoryService.getProductById);

function baseProduct(overrides: Partial<IProduct> = {}): IProduct {
    return {
        id: 'p-1',
        name: 'Rice',
        barcode: '1111',
        pluCode: null,
        description: null,
        category: 'grains',
        costPrice: 150,
        sellingPrice: 200,
        imageUrl: null,
        baseUnit: 'kg',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

function makeWrapper() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return Wrapper;
}

/**
 * Compose `useProductFormState` + `useProductLoader` so the test exercises
 * the real form-state hydration path. Returns `form.units` and the loader
 * loading flag for assertions.
 */
function renderLoader(productId: string | undefined) {
    const Wrapper = makeWrapper();
    return renderHook(
        () => {
            const form = useProductFormState();
            const loader = useProductLoader({
                productId,
                form,
                setImageUrl: () => {},
            });
            return { form, loader };
        },
        { wrapper: Wrapper },
    );
}

describe('useProductLoader hydration', () => {
    beforeEach(() => {
        getProductByIdMock.mockReset();
    });

    it('hydrates baseUnit and units when the API returns sellableUnits', async () => {
        getProductByIdMock.mockResolvedValueOnce(
            baseProduct({
                baseUnit: 'kg',
                sellableUnits: [
                    {
                        id: 'u-2',
                        productId: 'p-1',
                        name: '12-PACK',
                        barcode: 'RICE-12',
                        isBase: false,
                        conversionToBase: 12,
                        sellingPrice: 2200,
                        displayOrder: 1,
                    },
                    {
                        id: 'u-1',
                        productId: 'p-1',
                        name: 'kg',
                        barcode: null,
                        isBase: true,
                        conversionToBase: 1,
                        sellingPrice: 200,
                        displayOrder: 0,
                    },
                ],
            }),
        );
        const { result } = renderLoader('p-1');
        await waitFor(() => expect(result.current.form.units).toHaveLength(2));
        expect(result.current.form.baseUnit).toBe('kg');
        // Sorted by displayOrder.
        expect(result.current.form.units.map((r) => r.name)).toEqual([
            'kg',
            '12-PACK',
        ]);
        expect(result.current.form.units[0].isBase).toBe(true);
        expect(result.current.form.units[1].barcode).toBe('RICE-12');
        expect(result.current.form.units[1].conversionToBase).toBe('12');
        expect(result.current.form.units[1].sellingPrice).toBe('2200');
    });

    it('falls back to default rows when sellableUnits is missing', async () => {
        getProductByIdMock.mockResolvedValueOnce(
            baseProduct({ baseUnit: 'l', sellableUnits: undefined }),
        );
        const { result } = renderLoader('p-1');
        await waitFor(() => expect(result.current.form.baseUnit).toBe('l'));
        expect(result.current.form.units.map((r) => r.name)).toEqual(['l']);
    });

    it('falls back to default rows when sellableUnits is an empty array', async () => {
        getProductByIdMock.mockResolvedValueOnce(
            baseProduct({ baseUnit: 'unit', sellableUnits: [] }),
        );
        const { result } = renderLoader('p-1');
        await waitFor(() => expect(result.current.form.baseUnit).toBe('unit'));
        expect(result.current.form.units).toHaveLength(1);
        expect(result.current.form.units[0].name).toBe('unit');
    });

    it('defaults to "unit" when the API returns an unsupported baseUnit', async () => {
        getProductByIdMock.mockResolvedValueOnce(
            baseProduct({ baseUnit: 'something-weird', sellableUnits: undefined }),
        );
        const { result } = renderLoader('p-1');
        await waitFor(() => expect(result.current.form.baseUnit).toBe('unit'));
    });

    it('does not fetch when productId is undefined', () => {
        const { result } = renderLoader(undefined);
        expect(result.current.loader.isLoading).toBe(false);
        expect(getProductByIdMock).not.toHaveBeenCalled();
    });

    it('pins both price-unit selectors to the loaded baseUnit', async () => {
        getProductByIdMock.mockResolvedValueOnce(
            baseProduct({
                baseUnit: 'l',
                sellableUnits: [
                    {
                        id: 'u-1',
                        productId: 'p-1',
                        name: 'l',
                        barcode: null,
                        isBase: true,
                        conversionToBase: 1,
                        sellingPrice: 200,
                        displayOrder: 0,
                    },
                    {
                        id: 'u-2',
                        productId: 'p-1',
                        name: '5-L',
                        barcode: 'OIL-5L',
                        isBase: false,
                        conversionToBase: 5,
                        sellingPrice: 950,
                        displayOrder: 1,
                    },
                ],
            }),
        );
        const { result } = renderLoader('p-1');
        await waitFor(() => expect(result.current.form.baseUnit).toBe('l'));
        expect(result.current.form.costPriceUnit).toBe('l');
        expect(result.current.form.sellingPriceUnit).toBe('l');
    });
});
