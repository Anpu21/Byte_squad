import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type {
    DiscountSchemeScope,
    IDiscountScheme,
    IDiscountSchemePayload,
} from '@/types';
import { inventoryService } from '@/services/inventory.service';
import { categoriesService } from '@/services/categories.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { useSchemeMutations } from '../hooks/useSchemeMutations';

interface ISchemeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Present = edit mode; absent = create mode. */
    scheme?: IDiscountScheme | null;
}

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/25 transition-colors';

/**
 * Outer shell mounts the form only while open so each open starts with
 * fresh local state (same idiom as `SupplierFormModal`).
 */
export function SchemeFormModal({
    isOpen,
    onClose,
    scheme = null,
}: ISchemeFormModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={scheme ? `Edit ${scheme.name}` : 'New discount scheme'}
            maxWidth="lg"
            closeOnBackdrop={false}
        >
            {isOpen ? <SchemeForm onClose={onClose} scheme={scheme} /> : null}
        </Modal>
    );
}

interface ISchemeFormProps {
    onClose: () => void;
    scheme: IDiscountScheme | null;
}

function SchemeForm({ onClose, scheme }: ISchemeFormProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const { create, update } = useSchemeMutations();
    const isEdit = scheme !== null;

    const [name, setName] = useState(scheme?.name ?? '');
    const [branchId, setBranchId] = useState(scheme?.branchId ?? '');
    const [scope, setScope] = useState<DiscountSchemeScope>(
        scheme?.scope ?? 'Product',
    );
    const [productId, setProductId] = useState(scheme?.productId ?? '');
    const [category, setCategory] = useState(scheme?.category ?? '');
    const [minQty, setMinQty] = useState(String(Number(scheme?.minQty ?? 0)));
    const [discountPercentage, setDiscountPercentage] = useState(
        String(Number(scheme?.discountPercentage ?? 5)),
    );
    const [startDate, setStartDate] = useState(scheme?.startDate ?? '');
    const [endDate, setEndDate] = useState(scheme?.endDate ?? '');
    const [isActive, setIsActive] = useState(scheme?.isActive ?? true);

    const productsQuery = useQuery({
        queryKey: queryKeys.product.all(),
        queryFn: inventoryService.getProducts,
        enabled: scope === 'Product',
    });
    const categoriesQuery = useQuery({
        queryKey: queryKeys.categories.list(false),
        queryFn: () => categoriesService.list(false),
        enabled: scope === 'Category',
    });
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
        enabled: isAdmin,
    });

    const minQtyNum = Number(minQty);
    const pctNum = Number(discountPercentage);
    const canSubmit =
        name.trim().length >= 3 &&
        Number.isFinite(pctNum) &&
        pctNum > 0 &&
        pctNum <= 100 &&
        Number.isFinite(minQtyNum) &&
        minQtyNum >= 0 &&
        startDate !== '' &&
        endDate !== '' &&
        startDate <= endDate &&
        (scope === 'Product' ? productId !== '' : category !== '');

    const isPending = create.isPending || update.isPending;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit || isPending) return;
        const payload: IDiscountSchemePayload = {
            name: name.trim(),
            branchId: isAdmin
                ? branchId || undefined
                : (user?.branchId ?? undefined),
            scope,
            productId: scope === 'Product' ? productId : undefined,
            category: scope === 'Category' ? category : undefined,
            minQty: minQtyNum,
            discountPercentage: pctNum,
            startDate,
            endDate,
            isActive,
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1.5 sm:col-span-2">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Scheme name
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. June rice promo"
                        required
                        minLength={3}
                        maxLength={120}
                    />
                </label>
                {isAdmin && (
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Branch
                        </span>
                        <select
                            className={`${INPUT_CLASS} w-full`}
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                        >
                            <option value="">All branches</option>
                            {(branchesQuery.data ?? []).map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Applies to
                    </span>
                    <select
                        className={`${INPUT_CLASS} w-full`}
                        value={scope}
                        onChange={(e) =>
                            setScope(e.target.value as DiscountSchemeScope)
                        }
                    >
                        <option value="Product">A single product</option>
                        <option value="Category">A whole category</option>
                    </select>
                </label>
                {scope === 'Product' ? (
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Product
                        </span>
                        <select
                            className={`${INPUT_CLASS} w-full`}
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                {productsQuery.isLoading
                                    ? 'Loading products…'
                                    : 'Pick a product'}
                            </option>
                            {(productsQuery.data ?? []).map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : (
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Category
                        </span>
                        <select
                            className={`${INPUT_CLASS} w-full`}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                {categoriesQuery.isLoading
                                    ? 'Loading categories…'
                                    : 'Pick a category'}
                            </option>
                            {(categoriesQuery.data ?? []).map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Minimum quantity (0 = always)
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        type="number"
                        min="0"
                        step="any"
                        value={minQty}
                        onChange={(e) => setMinQty(e.target.value)}
                        required
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Discount %
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={discountPercentage}
                        onChange={(e) =>
                            setDiscountPercentage(e.target.value)
                        }
                        required
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Starts
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                </label>
                <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Ends
                    </span>
                    <input
                        className={`${INPUT_CLASS} w-full`}
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                    />
                </label>
                {isEdit && (
                    <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wide text-text-3">
                            Status
                        </span>
                        <select
                            className={`${INPUT_CLASS} w-full`}
                            value={isActive ? 'active' : 'paused'}
                            onChange={(e) =>
                                setIsActive(e.target.value === 'active')
                            }
                        >
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                        </select>
                    </label>
                )}
            </div>
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
