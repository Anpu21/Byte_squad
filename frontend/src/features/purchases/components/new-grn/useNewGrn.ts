import { type FormEvent, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { inventoryService } from '@/services/inventory.service';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { IGrnItemPayload, IPurchaseOrder } from '@/types';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useCreateGrn } from '../../hooks/useCreateGrn';
import {
    type ILineDraft,
    deriveGrnTotals,
    emptyLine,
    newLineKey,
} from './new-grn.lib';

interface UseNewGrnArgs {
    prefillOrder: IPurchaseOrder | null;
    onCreated: () => void;
}

/**
 * State + derived totals for goods-receipt entry: header (supplier/branch/
 * invoice), the received lines, weighted-average cost prefill, and the submit
 * that records stock IN, the ledger debit, and the supplier bill.
 */
export function useNewGrn({ prefillOrder, onCreated }: UseNewGrnArgs) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const createGrn = useCreateGrn();

    const [supplierId, setSupplierId] = useState(prefillOrder?.supplierId ?? '');
    const [branchId, setBranchId] = useState(prefillOrder?.branchId ?? '');
    const [grnDate, setGrnDate] = useState('');
    const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
    const [discount, setDiscount] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<ILineDraft[]>(() =>
        prefillOrder?.items?.length
            ? prefillOrder.items.map((it) => ({
                  key: newLineKey(),
                  productId: it.productId,
                  quantity: String(Number(it.quantity)),
                  unitCost: String(Number(it.unitCost)),
                  batchNo: '',
                  expiryDate: '',
              }))
            : [emptyLine()],
    );

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

    function patchLine(key: number, patch: Partial<ILineDraft>) {
        setLines((prev) =>
            prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
        );
    }

    function pickProduct(key: number, productId: string) {
        const product = productById.get(productId);
        // Prefill the unit cost with the current weighted-average cost —
        // the receiver corrects it from the supplier invoice when it moved.
        patchLine(key, {
            productId,
            unitCost: product ? String(product.costPrice) : '',
        });
    }

    function removeLine(key: number) {
        setLines((prev) =>
            prev.length > 1 ? prev.filter((l) => l.key !== key) : prev,
        );
    }

    function addLine() {
        setLines((prev) => [...prev, emptyLine()]);
    }

    const { parsedLines, completeLines, subTotal, discountNum, grandTotal } =
        deriveGrnTotals(lines, discount);

    const canSubmit =
        supplierId.length > 0 &&
        (!isAdmin || branchId.length > 0) &&
        completeLines.length === parsedLines.length &&
        completeLines.length > 0 &&
        Number.isFinite(discountNum) &&
        discountNum >= 0 &&
        grandTotal >= 0;

    function reset() {
        setSupplierId('');
        setBranchId('');
        setGrnDate('');
        setSupplierInvoiceNo('');
        setDiscount('');
        setNotes('');
        setLines([emptyLine()]);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!canSubmit || createGrn.isPending) return;
        const items: IGrnItemPayload[] = completeLines.map((l) => ({
            productId: l.productId,
            quantity: l.qtyNum,
            unitCost: l.costNum,
            batchNo: l.batchNo.trim() || undefined,
            expiryDate: l.expiryDate || undefined,
        }));
        try {
            const grn = await createGrn.mutateAsync({
                supplierId,
                branchId: isAdmin ? branchId : undefined,
                purchaseOrderId: prefillOrder?.id,
                grnDate: grnDate || undefined,
                supplierInvoiceNo: supplierInvoiceNo.trim() || undefined,
                discountAmount: discountNum > 0 ? discountNum : undefined,
                notes: notes.trim() || undefined,
                items,
            });
            toast.success(`${grn.grnNumber} received — stock updated`);
            reset();
            onCreated();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not record the receipt');
            } else {
                toast.error('Could not record the receipt');
            }
        }
    }

    return {
        isAdmin,
        supplierId,
        setSupplierId,
        branchId,
        setBranchId,
        grnDate,
        setGrnDate,
        supplierInvoiceNo,
        setSupplierInvoiceNo,
        discount,
        setDiscount,
        notes,
        setNotes,
        suppliersQuery,
        branchesQuery,
        productsQuery,
        products,
        parsedLines,
        subTotal,
        grandTotal,
        canSubmit,
        patchLine,
        pickProduct,
        removeLine,
        addLine,
        handleSubmit,
        isPending: createGrn.isPending,
    };
}
