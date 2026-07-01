import { type FormEvent, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { inventoryService } from '@/services/inventory.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { useSuppliers } from '../../hooks/useSuppliers';
import { usePurchaseOrderMutations } from '../../hooks/usePurchaseOrderMutations';
import {
    type IOrderLineDraft,
    deriveOrderTotals,
    emptyLine,
} from './order-form.lib';

/**
 * Purchase-order draft state: supplier/branch header, the ordered lines
 * (unit cost prefilled from the product's current cost), and the create.
 */
export function useOrderForm(onClose: () => void) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const { create } = usePurchaseOrderMutations();

    const [supplierId, setSupplierId] = useState('');
    const [branchId, setBranchId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<IOrderLineDraft[]>([emptyLine()]);

    const suppliersQuery = useSuppliers({ status: 'Active', limit: 100 });
    const productsQuery = useQuery({
        queryKey: queryKeys.product.all(),
        queryFn: inventoryService.getProducts,
    });
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
        enabled: isAdmin,
    });
    const products = useMemo(
        () => productsQuery.data ?? [],
        [productsQuery.data],
    );
    const productById = useMemo(
        () => new Map(products.map((p) => [p.id, p])),
        [products],
    );

    function patchLine(key: number, patch: Partial<IOrderLineDraft>) {
        setLines((prev) =>
            prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
        );
    }

    function pickProduct(key: number, productId: string, currentUnitCost: string) {
        const product = productById.get(productId);
        patchLine(key, {
            productId,
            unitCost: product ? String(product.costPrice) : currentUnitCost,
        });
    }

    function addLine() {
        setLines((prev) => [...prev, emptyLine()]);
    }

    function removeLine(key: number) {
        setLines((prev) =>
            prev.length > 1 ? prev.filter((l) => l.key !== key) : prev,
        );
    }

    const { parsed, complete, totalValue } = deriveOrderTotals(lines);
    const canSubmit =
        supplierId.length > 0 &&
        (!isAdmin || branchId.length > 0) &&
        complete.length === parsed.length &&
        complete.length > 0;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!canSubmit || create.isPending) return;
        try {
            const order = await create.mutateAsync({
                supplierId,
                branchId: isAdmin ? branchId : undefined,
                expectedDate: expectedDate || undefined,
                notes: notes.trim() || undefined,
                items: complete.map((l) => ({
                    productId: l.productId,
                    quantity: l.qtyNum,
                    unitCost: l.costNum,
                })),
            });
            toast.success(`${order.poNumber} created`);
            onClose();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not create the order');
            } else {
                toast.error('Could not create the order');
            }
        }
    }

    return {
        isAdmin,
        supplierId,
        setSupplierId,
        branchId,
        setBranchId,
        expectedDate,
        setExpectedDate,
        notes,
        setNotes,
        suppliersQuery,
        productsQuery,
        branchesQuery,
        products,
        parsed,
        totalValue,
        canSubmit,
        patchLine,
        pickProduct,
        addLine,
        removeLine,
        handleSubmit,
        isPending: create.isPending,
    };
}
