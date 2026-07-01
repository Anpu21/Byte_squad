import { type FormEvent, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { SupplierPaymentMethod } from '@/types';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useGrns } from '../../hooks/useGrns';
import { usePayablesOutstanding } from '../../hooks/usePayablesOutstanding';
import { useSupplierPayments } from '../../hooks/useSupplierPayments';
import { useCreateSupplierPayment } from '../../hooks/useCreateSupplierPayment';
import { OPENING_KEY } from './BillAllocationTable';

/**
 * State + derived allocation math for the Bills & Payments panel: supplier /
 * branch / method selection, the per-bill "against reference" amounts, and the
 * single payment-voucher submit.
 */
export function useBillPayment() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const createPayment = useCreateSupplierPayment();

    const [supplierId, setSupplierId] = useState('');
    const [branchId, setBranchId] = useState('');
    const [method, setMethod] = useState<SupplierPaymentMethod>('Cash');
    const [paidAt, setPaidAt] = useState('');
    const [alloc, setAlloc] = useState<Record<string, string>>({});

    const suppliersQuery = useSuppliers({ limit: 100 });
    const branchesQuery = useQuery({
        queryKey: queryKeys.branches.all(),
        queryFn: userService.getBranches,
        enabled: isAdmin,
    });
    const grnsQuery = useGrns({
        supplierId: supplierId || undefined,
        status: 'Received',
        limit: 100,
        offset: 0,
    });
    const outstandingQuery = usePayablesOutstanding();
    const paymentsQuery = useSupplierPayments({
        supplierId: supplierId || undefined,
        limit: 20,
    });

    const openBills = useMemo(
        () =>
            (grnsQuery.data?.rows ?? []).filter((g) => g.paymentStatus !== 'Paid'),
        [grnsQuery.data],
    );
    const outstandingRow = useMemo(
        () =>
            (outstandingQuery.data ?? []).find((r) => r.supplierId === supplierId),
        [outstandingQuery.data, supplierId],
    );
    const openingRemaining = outstandingRow?.openingRemaining ?? 0;

    const entries = Object.entries(alloc)
        .map(([key, raw]) => ({ key, amount: Number(raw) }))
        .filter((e) => Number.isFinite(e.amount) && e.amount > 0);
    const totalEntered = entries.reduce((sum, e) => sum + e.amount, 0);

    const overAllocated = entries.some((e) => {
        if (e.key === OPENING_KEY) return e.amount > openingRemaining;
        const bill = openBills.find((b) => b.id === e.key);
        if (!bill) return true;
        return e.amount > Number(bill.grandTotal) - Number(bill.paidAmount);
    });

    const canSubmit =
        supplierId.length > 0 &&
        (!isAdmin || branchId.length > 0) &&
        entries.length > 0 &&
        totalEntered > 0 &&
        !overAllocated;

    function setSupplier(next: string) {
        setSupplierId(next);
        setAlloc({});
    }

    function onAllocChange(key: string, value: string) {
        setAlloc((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!canSubmit || createPayment.isPending) return;
        try {
            const payment = await createPayment.mutateAsync({
                supplierId,
                branchId: isAdmin ? branchId : undefined,
                method,
                amount: Math.round(totalEntered * 100) / 100,
                paidAt: paidAt || undefined,
                allocations: entries.map((entry) => ({
                    grnId: entry.key === OPENING_KEY ? undefined : entry.key,
                    amount: entry.amount,
                })),
            });
            toast.success(
                `${payment.paymentNumber} recorded — ${formatCurrency(Number(payment.amount))}`,
            );
            setAlloc({});
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not record the payment');
            } else {
                toast.error('Could not record the payment');
            }
        }
    }

    return {
        isAdmin,
        supplierId,
        setSupplier,
        branchId,
        setBranchId,
        method,
        setMethod,
        paidAt,
        setPaidAt,
        alloc,
        onAllocChange,
        suppliersQuery,
        branchesQuery,
        paymentsQuery,
        openBills,
        outstandingRow,
        openingRemaining,
        totalEntered,
        overAllocated,
        canSubmit,
        handleSubmit,
        isPending: createPayment.isPending,
    };
}
