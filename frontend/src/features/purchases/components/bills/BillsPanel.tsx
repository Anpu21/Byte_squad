import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { DataTable, type DataTableColumn } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { userService } from '@/services/user.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { ISupplierPayment, SupplierPaymentMethod } from '@/types';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useGrns } from '../../hooks/useGrns';
import { usePayablesOutstanding } from '../../hooks/usePayablesOutstanding';
import { useSupplierPayments } from '../../hooks/useSupplierPayments';
import { useCreateSupplierPayment } from '../../hooks/useCreateSupplierPayment';
import { GrnPaymentPill } from '../grns/GrnPaymentPill';

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/25 transition-colors';

const OPENING_KEY = 'opening';

/**
 * Bills & Payments: pick a supplier, see their open bills (and unsettled
 * opening balance), type how much goes against each — BUSY's bill-by-bill
 * "Against Reference" — and record one payment voucher for the total.
 */
export function BillsPanel() {
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
            (grnsQuery.data?.rows ?? []).filter(
                (g) => g.paymentStatus !== 'Paid',
            ),
        [grnsQuery.data],
    );
    const outstandingRow = useMemo(
        () =>
            (outstandingQuery.data ?? []).find(
                (r) => r.supplierId === supplierId,
            ),
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
        return (
            e.amount > Number(bill.grandTotal) - Number(bill.paidAmount)
        );
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

    async function handleSubmit(e: React.FormEvent) {
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

    const paymentColumns: DataTableColumn<ISupplierPayment>[] = [
        {
            key: 'number',
            header: '#',
            render: (p) => (
                <span className="text-[13px] text-text-1 mono">
                    {p.paymentNumber}
                </span>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            render: (p) => (
                <span className="text-[13px] text-text-2">{p.paidAt}</span>
            ),
        },
        {
            key: 'method',
            header: 'Method',
            render: (p) => (
                <span className="text-[13px] text-text-2">{p.method}</span>
            ),
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            numeric: true,
            render: (p) => (
                <span className="text-[13px] tabular-nums text-text-1">
                    {formatCurrency(Number(p.amount))}
                </span>
            ),
        },
        {
            key: 'settled',
            header: 'Bills settled',
            align: 'right',
            numeric: true,
            render: (p) => (
                <span className="text-[13px] tabular-nums text-text-2">
                    {p.allocations?.length ?? 0}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <Card className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="block space-y-1.5">
                            <span className="text-[11px] uppercase tracking-wide text-text-3">
                                Supplier
                            </span>
                            <select
                                className={`${INPUT_CLASS} min-w-[220px]`}
                                value={supplierId}
                                onChange={(e) => setSupplier(e.target.value)}
                            >
                                <option value="">
                                    {suppliersQuery.isLoading
                                        ? 'Loading…'
                                        : 'Select supplier'}
                                </option>
                                {(suppliersQuery.data?.rows ?? []).map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {isAdmin && (
                            <label className="block space-y-1.5">
                                <span className="text-[11px] uppercase tracking-wide text-text-3">
                                    Paying branch
                                </span>
                                <select
                                    className={INPUT_CLASS}
                                    value={branchId}
                                    onChange={(e) =>
                                        setBranchId(e.target.value)
                                    }
                                >
                                    <option value="">Select branch</option>
                                    {(branchesQuery.data ?? [])
                                        .filter((b) => b.isActive)
                                        .map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                </select>
                            </label>
                        )}
                        <label className="block space-y-1.5">
                            <span className="text-[11px] uppercase tracking-wide text-text-3">
                                Method
                            </span>
                            <select
                                className={INPUT_CLASS}
                                value={method}
                                onChange={(e) =>
                                    setMethod(
                                        e.target.value as SupplierPaymentMethod,
                                    )
                                }
                            >
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank transfer</option>
                            </select>
                        </label>
                        <label className="block space-y-1.5">
                            <span className="text-[11px] uppercase tracking-wide text-text-3">
                                Paid date
                            </span>
                            <input
                                className={INPUT_CLASS}
                                type="date"
                                value={paidAt}
                                onChange={(e) => setPaidAt(e.target.value)}
                            />
                        </label>
                    </div>

                    {!supplierId ? (
                        <EmptyState
                            title="Pick a supplier"
                            description="Their open bills and unsettled opening balance will list here for allocation."
                        />
                    ) : (
                        <div className="overflow-x-auto border border-border rounded-md">
                            <table className="w-full text-left">
                                <thead className="bg-surface-2/60 border-b border-border">
                                    <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                        <th className="px-3 py-2 font-medium">
                                            Bill
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Due
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            State
                                        </th>
                                        <th className="px-3 py-2 font-medium text-right">
                                            Total
                                        </th>
                                        <th className="px-3 py-2 font-medium text-right">
                                            Remaining
                                        </th>
                                        <th className="px-3 py-2 font-medium text-right w-36">
                                            Pay now
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {openingRemaining > 0 && (
                                        <tr className="border-b border-border bg-surface-2/30">
                                            <td className="px-3 py-2 text-[13px] text-text-1 italic">
                                                Opening balance
                                            </td>
                                            <td className="px-3 py-2 text-[12px] text-text-3">
                                                —
                                            </td>
                                            <td className="px-3 py-2 text-[12px] text-text-3">
                                                Pre-system
                                            </td>
                                            <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-2">
                                                {formatCurrency(
                                                    outstandingRow?.openingBalance ??
                                                        0,
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-1">
                                                {formatCurrency(
                                                    openingRemaining,
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className={`${INPUT_CLASS} w-full h-8 text-right`}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        alloc[OPENING_KEY] ??
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setAlloc((prev) => ({
                                                            ...prev,
                                                            [OPENING_KEY]:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    aria-label="Pay against opening balance"
                                                />
                                            </td>
                                        </tr>
                                    )}
                                    {openBills.map((bill) => {
                                        const remaining =
                                            Number(bill.grandTotal) -
                                            Number(bill.paidAmount);
                                        return (
                                            <tr
                                                key={bill.id}
                                                className="border-b border-border last:border-b-0"
                                            >
                                                <td className="px-3 py-2 text-[13px] text-text-1 mono">
                                                    {bill.grnNumber}
                                                </td>
                                                <td className="px-3 py-2 text-[12px] text-text-2 whitespace-nowrap">
                                                    {bill.dueDate}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <GrnPaymentPill
                                                        status={
                                                            bill.paymentStatus
                                                        }
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-2">
                                                    {formatCurrency(
                                                        Number(
                                                            bill.grandTotal,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-1">
                                                    {formatCurrency(remaining)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        className={`${INPUT_CLASS} w-full h-8 text-right`}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            alloc[bill.id] ??
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setAlloc(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [bill.id]:
                                                                        e
                                                                            .target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        aria-label={`Pay against ${bill.grnNumber}`}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {openBills.length === 0 &&
                                        openingRemaining <= 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-3 py-6 text-center text-sm text-text-3"
                                                >
                                                    Nothing outstanding for
                                                    this supplier 🎉
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3">
                        {overAllocated && (
                            <span className="text-xs text-danger">
                                An amount exceeds its bill&apos;s remainder.
                            </span>
                        )}
                        <span className="text-sm text-text-2">
                            Total:{' '}
                            <span className="font-semibold text-text-1 tabular-nums">
                                {formatCurrency(totalEntered)}
                            </span>
                        </span>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!canSubmit || createPayment.isPending}
                        >
                            {createPayment.isPending
                                ? 'Recording…'
                                : 'Record payment'}
                        </Button>
                    </div>
                </form>
            </Card>

            {supplierId && (paymentsQuery.data?.rows.length ?? 0) > 0 && (
                <Card className="overflow-hidden">
                    <div className="px-4 py-3 border-b border-border text-[12px] uppercase tracking-wide text-text-3">
                        Recent payments
                    </div>
                    <DataTable<ISupplierPayment>
                        columns={paymentColumns}
                        rows={paymentsQuery.data?.rows ?? []}
                        getRowKey={(p) => p.id}
                        zebra
                    />
                </Card>
            )}
        </div>
    );
}
