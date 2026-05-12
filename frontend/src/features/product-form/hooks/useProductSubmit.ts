import { useState } from 'react';
import toast from 'react-hot-toast';
import { inventoryService } from '@/services/inventory.service';
import type { ProductFormState } from './useProductFormState';
import {
    focusFirstInvalidField,
    validateProductForm,
} from '../lib/form-validation';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors = validateProductForm(form, isEditMode);
        form.setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            focusFirstInvalidField(newErrors);
            return;
        }

        setIsSubmitting(true);
        form.setErrors({});

        const payload = {
            name: form.name.trim(),
            barcode: form.barcode.trim(),
            description: form.description.trim() || undefined,
            category: form.category.trim(),
            costPrice: parseFloat(form.costPrice),
            sellingPrice: parseFloat(form.sellingPrice),
        };

        try {
            if (isEditMode && productId) {
                await inventoryService.updateProduct(productId, payload);
            } else {
                const product = await inventoryService.createProduct(payload);
                if (branchId) {
                    await inventoryService.createInventory({
                        productId: product.id,
                        branchId,
                        quantity: form.initialStock
                            ? parseInt(form.initialStock, 10)
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
