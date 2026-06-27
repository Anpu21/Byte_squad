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

interface MakeFormOverrides {
    units?: ISellableUnitRow[];
    costPrice?: string;
    sellingPrice?: string;
    costPriceUnit?: string;
    sellingPriceUnit?: string;
    costPriceQty?: string;
    sellingPriceQty?: string;
    baseUnit?: string;
}

function makeForm(overrides: MakeFormOverrides = {}): ProductFormState {
    const defaultUnits: ISellableUnitRow[] = [
        {
            rowId: 'r1',
            name: 'kg',
            barcode: '',
            isBase: true,
            conversionToBase: '1',
            sellingPrice: '',
            displayOrder: 0,
        },
    ];
    const units = overrides.units ?? defaultUnits;
    const baseUnit = overrides.baseUnit ?? 'kg';
    return {
        name: 'Rice 5kg',
        setName: vi.fn(),
        barcode: '8901234567890',
        setBarcode: vi.fn(),
        pluCode: '',
        setPluCode: vi.fn(),
        description: '',
        setDescription: vi.fn(),
        category: 'Grocery',
        setCategory: vi.fn(),
        costPrice: overrides.costPrice ?? '100',
        setCostPrice: vi.fn(),
        sellingPrice: overrides.sellingPrice ?? '150',
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
        baseUnit,
        setBaseUnit: vi.fn(),
        units,
        setUnits: vi.fn(),
        resetUnitsForBase: vi.fn(),
        addUnit: vi.fn(),
        updateUnit: vi.fn(),
        removeUnit: vi.fn(),
        setBaseRow: vi.fn(),
        costPriceUnit: overrides.costPriceUnit ?? baseUnit,
        setCostPriceUnit: vi.fn(),
        sellingPriceUnit: overrides.sellingPriceUnit ?? baseUnit,
        setSellingPriceUnit: vi.fn(),
        costPriceQty: overrides.costPriceQty ?? '1',
        setCostPriceQty: vi.fn(),
        sellingPriceQty: overrides.sellingPriceQty ?? '1',
        setSellingPriceQty: vi.fn(),
        resetPriceUnitsTo: vi.fn(),
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

describe('useProductSubmit price normalization', () => {
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

    it('normalizes selling price entered against a pack unit to per-base unit', async () => {
        const { Wrapper } = makeWrapper();
        const customUnits: ISellableUnitRow[] = [
            {
                rowId: 'r1',
                name: 'unit',
                barcode: '',
                isBase: true,
                conversionToBase: '1',
                sellingPrice: '',
                displayOrder: 0,
            },
            {
                rowId: 'r2',
                name: '12-PACK',
                barcode: 'EGG-12',
                isBase: false,
                conversionToBase: '12',
                sellingPrice: '650',
                displayOrder: 1,
            },
        ];
        const form = makeForm({
            baseUnit: 'unit',
            units: customUnits,
            sellingPrice: '650',
            sellingPriceUnit: '12-PACK',
        });
        const { result } = renderHook(
            () =>
                useProductSubmit({
                    form,
                    isEditMode: true,
                    productId: 'prod-1',
                    branchId: null,
                    pendingImageFile: null,
                    onSuccess: vi.fn(),
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
            expect.objectContaining({ sellingPrice: 650 / 12 }),
        );
    });

    it('normalizes cost price entered against a custom fractional KG row', async () => {
        const customUnits: ISellableUnitRow[] = [
            {
                rowId: 'r1',
                name: 'kg',
                barcode: '',
                isBase: true,
                conversionToBase: '1',
                sellingPrice: '',
                displayOrder: 0,
            },
            {
                rowId: 'r2',
                name: '0.250 KG',
                barcode: '',
                isBase: false,
                conversionToBase: '0.25',
                sellingPrice: '125',
                displayOrder: 1,
            },
        ];
        const { Wrapper } = makeWrapper();
        const form = makeForm({
            units: customUnits,
            costPrice: '125',
            costPriceUnit: '0.250 KG',
        });
        const { result } = renderHook(
            () =>
                useProductSubmit({
                    form,
                    isEditMode: true,
                    productId: 'prod-1',
                    branchId: null,
                    pendingImageFile: null,
                    onSuccess: vi.fn(),
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
            expect.objectContaining({ costPrice: 500 }),
        );
    });

    it('passes prices through unchanged when both price units equal the base unit', async () => {
        const { Wrapper } = makeWrapper();
        const form = makeForm({
            costPrice: '300',
            sellingPrice: '500',
            costPriceUnit: 'kg',
            sellingPriceUnit: 'kg',
        });
        const { result } = renderHook(
            () =>
                useProductSubmit({
                    form,
                    isEditMode: true,
                    productId: 'prod-1',
                    branchId: null,
                    pendingImageFile: null,
                    onSuccess: vi.fn(),
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
            expect.objectContaining({ costPrice: 300, sellingPrice: 500 }),
        );
    });

    it('surfaces a general form error and skips the API call when the price unit is unknown', async () => {
        const { Wrapper } = makeWrapper();
        const setErrors = vi.fn();
        const form = {
            ...makeForm({ sellingPriceUnit: 'sack' }),
            setErrors,
        } as ProductFormState;
        const { result } = renderHook(
            () =>
                useProductSubmit({
                    form,
                    isEditMode: true,
                    productId: 'prod-1',
                    branchId: null,
                    pendingImageFile: null,
                    onSuccess: vi.fn(),
                }),
            { wrapper: Wrapper },
        );

        await act(async () => {
            await result.current.handleSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent);
        });

        expect(inventoryService.updateProduct).not.toHaveBeenCalled();
        expect(setErrors).toHaveBeenCalledWith(
            expect.objectContaining({
                general: expect.stringContaining('Price normalization failed'),
            }),
        );
    });

    it('divides the entered price by the basis quantity before storing (200 for 0.5 kg → 400)', async () => {
        const { Wrapper } = makeWrapper();
        const form = makeForm({
            sellingPrice: '200',
            sellingPriceQty: '0.5',
            costPrice: '100',
            costPriceQty: '0.5',
        });
        const { result } = renderHook(
            () =>
                useProductSubmit({
                    form,
                    isEditMode: true,
                    productId: 'prod-1',
                    branchId: null,
                    pendingImageFile: null,
                    onSuccess: vi.fn(),
                }),
            { wrapper: Wrapper },
        );

        await act(async () => {
            await result.current.handleSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent);
        });

        // Stored prices are per 1 base unit: 200 / 0.5 = 400, 100 / 0.5 = 200.
        expect(inventoryService.updateProduct).toHaveBeenCalledWith(
            'prod-1',
            expect.objectContaining({ sellingPrice: 400, costPrice: 200 }),
        );
    });

    it('surfaces a general error and skips the API call when a price basis quantity is zero', async () => {
        const { Wrapper } = makeWrapper();
        const setErrors = vi.fn();
        const form = {
            ...makeForm({ sellingPriceQty: '0' }),
            setErrors,
        } as ProductFormState;
        const { result } = renderHook(
            () =>
                useProductSubmit({
                    form,
                    isEditMode: true,
                    productId: 'prod-1',
                    branchId: null,
                    pendingImageFile: null,
                    onSuccess: vi.fn(),
                }),
            { wrapper: Wrapper },
        );

        await act(async () => {
            await result.current.handleSubmit({
                preventDefault: vi.fn(),
            } as unknown as React.FormEvent);
        });

        expect(inventoryService.updateProduct).not.toHaveBeenCalled();
        expect(setErrors).toHaveBeenCalledWith(
            expect.objectContaining({
                general: expect.stringContaining('Price normalization failed'),
            }),
        );
    });
});
