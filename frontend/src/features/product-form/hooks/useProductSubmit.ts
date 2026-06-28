import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ProductFormState } from './useProductFormState';
import {
    focusFirstInvalidField,
    validateProductForm,
} from '../lib/form-validation';
import { validateUnitsRows } from '../lib/validate-units-rows';
import { normalizePriceToBaseUnit } from '../lib/normalize-price';

const DEFAULT_THRESHOLD = 10;

interface UseProductSubmitArgs {
    form: ProductFormState;
    isEditMode: boolean;
    productId: string | undefined;
    branchId: string | null | undefined;
    pendingImageFile: File | null;
    onSuccess: () => void;
}

function isConflictError(err: unknown): boolean {
    return (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status === 409
    );
}

export function useProductSubmit({
    form,
    isEditMode,
    productId,
    branchId,
    pendingImageFile,
    onSuccess,
}: UseProductSubmitArgs) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validateProductForm(form, isEditMode);
        const unitsResult = validateUnitsRows(form.units, form.barcode);
        if (!unitsResult.ok) {
            newErrors.sellableUnits = unitsResult.error;
            form.setErrors(newErrors);
            focusFirstInvalidField(newErrors);
            return;
        }
        if (Object.keys(newErrors).length > 0) {
            form.setErrors(newErrors);
            focusFirstInvalidField(newErrors);
            return;
        }

        // Normalize the manager-entered prices to the canonical per-base-unit
        // value before packing the payload. The cost/selling price inputs are
        // denominated in whichever sellable-unit row the manager picked (e.g.
        // "Rs 650 per 12-PACK" for a unit-based product); the BE always persists
        // the compatibility product price per base unit. Done after validation so we know the
        // units array is sound enough to resolve the conversion factor.
        let normalizedCostPrice: number;
        let normalizedSellingPrice: number;
        try {
            normalizedCostPrice = normalizePriceToBaseUnit(
                parseFloat(form.costPrice),
                form.costPriceUnit,
                form.units,
                parseFloat(form.costPriceQty || '1'),
            );
            normalizedSellingPrice = normalizePriceToBaseUnit(
                parseFloat(form.sellingPrice),
                form.sellingPriceUnit,
                form.units,
                parseFloat(form.sellingPriceQty || '1'),
            );
        } catch (err) {
            form.setErrors({
                general:
                    err instanceof Error
                        ? `Price normalization failed: ${err.message}`
                        : 'Price normalization failed',
            });
            return;
        }

        setIsSubmitting(true);
        form.setErrors({});

        const sellableUnits = unitsResult.rows.map((row) =>
            row.isBase
                ? { ...row, sellingPrice: normalizedSellingPrice }
                : row,
        );

        const payload = {
            name: form.name.trim(),
            barcode: form.barcode.trim(),
            pluCode: form.pluCode.trim() || undefined,
            description: form.description.trim() || undefined,
            category: form.category.trim(),
            brand: form.brand.trim() || undefined,
            costPrice: normalizedCostPrice,
            sellingPrice: normalizedSellingPrice,
            baseUnit: form.baseUnit,
            sellableUnits,
        };

        try {
            let savedProductId: string | undefined;
            if (isEditMode && productId) {
                await inventoryService.updateProduct(productId, payload);
                savedProductId = productId;
            } else {
                const product = await inventoryService.createProduct(payload);
                savedProductId = product.id;
                if (branchId) {
                    await inventoryService.createInventory({
                        productId: product.id,
                        branchId,
                        quantity: form.initialStock
                            ? parseFloat(form.initialStock)
                            : 0,
                        lowStockThreshold:
                            parseInt(form.lowStockThreshold, 10) ||
                            DEFAULT_THRESHOLD,
                    });
                }
                if (pendingImageFile) {
                    try {
                        await inventoryService.uploadProductImage(
                            product.id,
                            pendingImageFile,
                        );
                    } catch {
                        toast.error(
                            'Product saved but image upload failed. Edit the product to retry.',
                        );
                    }
                }
            }
            if (savedProductId) {
                void queryClient.invalidateQueries({
                    queryKey: queryKeys.pos.productUnits(savedProductId),
                });
            }
            void queryClient.invalidateQueries({
                queryKey: ['pos', 'searchProducts'],
            });
            onSuccess();
        } catch (err: unknown) {
            form.setErrors(
                isConflictError(err)
                    ? { barcode: 'A product with this barcode already exists' }
                    : { general: 'Failed to save product. Please try again.' },
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return { isSubmitting, handleSubmit };
}
