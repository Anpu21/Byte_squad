import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { useProductSubmit } from '../useProductSubmit';
import type { ProductFormState } from '../useProductFormState';
import type { ISellableUnitRow } from '../../types/sellable-unit-row.type';

vi.mock('@/services/inventory.service', () => ({
    inventoryService: {
        createProduct: vi.fn(),
        updateProduct: vi.fn(),
        createInventory: vi.fn(),
        uploadProductImage: vi.fn(),
    },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/lib/queryKeys';

function makeForm(): ProductFormState {
    const units: ISellableUnitRow[] = [
        {
            rowId: 'r1',
            name: 'kg',
            isBase: true,
            conversionToBase: '1',
            displayOrder: 0,
        },
        {
            rowId: 'r2',
            name: 'g',
            isBase: false,
            conversionToBase: '0.001',
            displayOrder: 1,
        },
    ];
    return {
        name: 'Rice 5kg',
        setName: vi.fn(),
        barcode: '8901234567890',
        setBarcode: vi.fn(),
        description: '',
        setDescription: vi.fn(),
        category: 'Grocery',
        setCategory: vi.fn(),
        costPrice: '100',
        setCostPrice: vi.fn(),
        sellingPrice: '150',
        setSellingPrice: vi.fn(),
        initialStock: '20',
        setInitialStock: vi.fn(),
        lowStockThreshold: '5',
        setLowStockThreshold: vi.fn(),
        errors: {},
        setErrors: vi.fn(),
        barcodeStatus: 'idle',
        setBarcodeStatus: vi.fn(),
        scanDetected: false,
        setScanDetected: vi.fn(),
        baseUnit: 'kg',
        setBaseUnit: vi.fn(),
        units,
        setUnits: vi.fn(),
        resetUnitsForBase: vi.fn(),
        addUnit: vi.fn(),
        updateUnit: vi.fn(),
        removeUnit: vi.fn(),
        setBaseRow: vi.fn(),
    } as unknown as ProductFormState;
}

function makeWrapper(): {
    Wrapper: ({ children }: { children: ReactNode }) => ReactElement;
    client: QueryClient;
} {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );
    }
    return { Wrapper, client };
}

describe('useProductSubmit cache invalidation', () => {
    beforeEach(() => {
        vi.mocked(inventoryService.updateProduct).mockResolvedValue(
            undefined as never,
        );
        vi.mocked(inventoryService.createProduct).mockResolvedValue({
            id: 'new-1',
        } as never);
        vi.mocked(inventoryService.createInventory).mockResolvedValue(
            undefined as never,
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('invalidates POS productUnits and searchProducts caches after a successful update', async () => {
        const { Wrapper, client } = makeWrapper();
        const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
        const onSuccess = vi.fn();
        const { result } = renderHook(
            () =>
                useProductSubmit({
                    form: makeForm(),
                    isEditMode: true,
                    productId: 'prod-1',
                    branchId: null,
                    pendingImageFile: null,
                    onSuccess,
                }),
            { wrapper: Wrapper },
        );

        await act(async () => {
            await result.current.handleSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent);
        });

        expect(inventoryService.updateProduct).toHaveBeenCalledWith(
            'prod-1',
            expect.objectContaining({ baseUnit: 'kg' }),
        );
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.productUnits('prod-1'),
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['pos', 'searchProducts'],
        });
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('invalidates productUnits with the new product id after a successful create', async () => {
        const { Wrapper, client } = makeWrapper();
        const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
        const onSuccess = vi.fn();
        const { result } = renderHook(
            () =>
                useProductSubmit({
                    form: makeForm(),
                    isEditMode: false,
                    productId: undefined,
                    branchId: 'branch-1',
                    pendingImageFile: null,
                    onSuccess,
                }),
            { wrapper: Wrapper },
        );

        await act(async () => {
            await result.current.handleSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent);
        });

        expect(inventoryService.createProduct).toHaveBeenCalledTimes(1);
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: queryKeys.pos.productUnits('new-1'),
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ['pos', 'searchProducts'],
        });
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });
});
