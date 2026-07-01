import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { IDiscountScheme, IDiscountSchemePayload } from '@/types';
import { inventoryService } from '@/services/inventory.service';
import { categoriesService } from '@/services/categories.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { useSchemeMutations } from '../hooks/useSchemeMutations';
import {
    SchemeFormFields,
    type SchemeFormValues,
    type SetSchemeField,
} from './SchemeFormFields';

interface ISchemeFormProps {
    onClose: () => void;
    scheme: IDiscountScheme | null;
}

export function SchemeForm({ onClose, scheme }: ISchemeFormProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const { create, update } = useSchemeMutations();
    const isEdit = scheme !== null;

    const [form, setForm] = useState<SchemeFormValues>({
        name: scheme?.name ?? '',
        branchId: scheme?.branchId ?? '',
        scope: scheme?.scope ?? 'Product',
        productId: scheme?.productId ?? '',
        productDraft: null,
        category: scheme?.category ?? '',
        minQty: String(Number(scheme?.minQty ?? 0)),
        discountPercentage: String(Number(scheme?.discountPercentage ?? 5)),
        startDate: scheme?.startDate ?? '',
        endDate: scheme?.endDate ?? '',
        isActive: scheme?.isActive ?? true,
    });
    const set: SetSchemeField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const productsQuery = useQuery({
        queryKey: queryKeys.product.all(),
        queryFn: inventoryService.getProducts,
        enabled: form.scope === 'Product',
    });
    const categoriesQuery = useQuery({
        queryKey: queryKeys.categories.list(false),
        queryFn: () => categoriesService.list(false),
        enabled: form.scope === 'Category',
    });
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
        enabled: isAdmin,
    });

    // The Product field is a free-text box with product suggestions (datalist);
    // what the user types resolves to the matching product id, so the scheme still
    // stores an id and the POS can apply the discount. `productDraft` wins until
    // the user has typed; otherwise the saved product's name is derived from the id.
    const products = productsQuery.data ?? [];
    const matchedName =
        products.find((p) => p.id === form.productId)?.name ?? '';
    const productInput = form.productDraft ?? matchedName;

    function onProductInput(value: string) {
        const match = products.find((p) => p.name === value);
        setForm((prev) => ({
            ...prev,
            productDraft: value,
            productId: match?.id ?? '',
        }));
    }

    const minQtyNum = Number(form.minQty);
    const pctNum = Number(form.discountPercentage);
    const canSubmit =
        form.name.trim().length >= 3 &&
        Number.isFinite(pctNum) &&
        pctNum > 0 &&
        pctNum <= 100 &&
        Number.isFinite(minQtyNum) &&
        minQtyNum >= 0 &&
        form.startDate !== '' &&
        form.endDate !== '' &&
        form.startDate <= form.endDate &&
        (form.scope === 'Product' ? form.productId !== '' : form.category !== '');

    const isPending = create.isPending || update.isPending;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit || isPending) return;
        const payload: IDiscountSchemePayload = {
            name: form.name.trim(),
            branchId: isAdmin
                ? form.branchId || undefined
                : (user?.branchId ?? undefined),
            scope: form.scope,
            productId: form.scope === 'Product' ? form.productId : undefined,
            category: form.scope === 'Category' ? form.category : undefined,
            minQty: minQtyNum,
            discountPercentage: pctNum,
            startDate: form.startDate,
            endDate: form.endDate,
            isActive: form.isActive,
        };
        try {
            if (isEdit) {
                await update.mutateAsync({ id: scheme.id, payload });
                toast.success('Scheme updated');
            } else {
                await create.mutateAsync(payload);
                toast.success('Scheme created');
            }
            onClose();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not save the scheme');
            } else {
                toast.error('Could not save the scheme');
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <SchemeFormFields
                form={form}
                set={set}
                isAdmin={isAdmin}
                isEdit={isEdit}
                productInput={productInput}
                onProductInput={onProductInput}
                products={products}
                productsLoading={productsQuery.isLoading}
                categories={categoriesQuery.data ?? []}
                categoriesLoading={categoriesQuery.isLoading}
                branches={branchesQuery.data ?? []}
            />
            <div className="flex justify-end gap-2 pt-1">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isPending}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={isPending || !canSubmit}
                >
                    {isPending
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : 'Create scheme'}
                </Button>
            </div>
        </form>
    );
}
