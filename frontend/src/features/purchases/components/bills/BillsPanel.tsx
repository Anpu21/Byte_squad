import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { DataTable, FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { ISupplierPayment, SupplierPaymentMethod } from '@/types';
import { useBillPayment } from './useBillPayment';
import { BillAllocationTable } from './BillAllocationTable';
import { PAYMENT_COLUMNS } from './bill-payment-columns';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

/**
 * Bills & Payments: pick a supplier, see their open bills (and unsettled
 * opening balance), type how much goes against each — BUSY's bill-by-bill
 * "Against Reference" — and record one payment voucher for the total.
 */
export function BillsPanel() {
    const p = useBillPayment();

    return (
        <div className="space-y-4">
            <Card className="p-5">
                <form onSubmit={p.handleSubmit} className="space-y-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="block space-y-1.5">
                            <span className="text-[11px] uppercase tracking-wide text-text-3">
                                Supplier
                            </span>
                            <select
                                className={`${INPUT_CLASS} field-select min-w-[220px]`}
                                value={p.supplierId}
                                onChange={(e) => p.setSupplier(e.target.value)}
                            >
                                <option value="">
                                    {p.suppliersQuery.isLoading
                                        ? 'Loading…'
                                        : 'Select supplier'}
                                </option>
                                {(p.suppliersQuery.data?.rows ?? []).map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {p.isAdmin && (
                            <label className="block space-y-1.5">
                                <span className="text-[11px] uppercase tracking-wide text-text-3">
                                    Paying branch
                                </span>
                                <select
                                    className={`${INPUT_CLASS} field-select`}
                                    value={p.branchId}
                                    onChange={(e) => p.setBranchId(e.target.value)}
                                >
                                    <option value="">Select branch</option>
                                    {(p.branchesQuery.data ?? [])
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
                                className={`${INPUT_CLASS} field-select`}
                                value={p.method}
                                onChange={(e) =>
                                    p.setMethod(
                                        e.target.value as SupplierPaymentMethod,
                                    )
                                }
                            >
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                            </select>
                        </label>
                        <label className="block space-y-1.5">
                            <span className="text-[11px] uppercase tracking-wide text-text-3">
                                Paid date
                            </span>
                            <input
                                className={`${INPUT_CLASS}${p.paidAt ? '' : ' date-empty'}`}
                                type="date"
                                value={p.paidAt}
                                onChange={(e) => p.setPaidAt(e.target.value)}
                            />
                        </label>
                    </div>

                    {!p.supplierId ? (
                        <EmptyState
                            title="Pick a supplier"
                            description="Their open bills and unsettled opening balance will list here for allocation."
                        />
                    ) : (
                        <BillAllocationTable
                            openBills={p.openBills}
                            openingBalance={p.outstandingRow?.openingBalance ?? 0}
                            openingRemaining={p.openingRemaining}
                            alloc={p.alloc}
                            onAllocChange={p.onAllocChange}
                        />
                    )}

                    <div className="flex items-center justify-end gap-3">
                        {p.overAllocated && (
                            <span className="text-xs text-danger">
                                An amount exceeds its bill&apos;s remainder.
                            </span>
                        )}
                        <span className="text-sm text-text-2">
                            Total:{' '}
                            <span className="font-semibold text-text-1 tabular-nums">
                                {formatCurrency(p.totalEntered)}
                            </span>
                        </span>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!p.canSubmit || p.isPending}
                        >
                            {p.isPending ? 'Recording…' : 'Record payment'}
                        </Button>
                    </div>
                </form>
            </Card>

            {p.supplierId && (p.paymentsQuery.data?.rows.length ?? 0) > 0 && (
                <Card className="overflow-hidden">
                    <div className="px-4 py-3 border-b border-border text-[12px] uppercase tracking-wide text-text-3">
                        Recent payments
                    </div>
                    <DataTable<ISupplierPayment>
                        columns={PAYMENT_COLUMNS}
                        rows={p.paymentsQuery.data?.rows ?? []}
                        getRowKey={(pay) => pay.id}
                        zebra
                    />
                </Card>
            )}
        </div>
    );
}
