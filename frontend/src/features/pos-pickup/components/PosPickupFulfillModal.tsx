import { LuBan as Ban, LuBanknote as Banknote } from 'react-icons/lu';
import { Button, Modal, StatusPill } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerOrder } from '@/types';
import { OrderItemsList } from '@/features/customer-orders/components/OrderItemsList';
import { STAFF_ORDER_STATUS_LABEL } from '@/features/customer-orders/lib/order-status';
import { PaymentStatusBadge } from '@/features/my-orders/components/PaymentStatusBadge';

interface PosPickupFulfillModalProps {
    order: ICustomerOrder | null;
    canManage: boolean;
    isFulfillable: boolean;
    requiresPayment: boolean;
    isOnlineBlocked: boolean;
    submitting: boolean;
    actionPending: boolean;
    onConfirm: () => void;
    onMarkNotCollected: (id: string) => void;
    onClose: () => void;
}

/**
 * In-place collection modal for a single pickup order. Opened by a scan, a
 * code lookup, or a queue row. Manual orders settle in cash at the till;
 * online orders must already be paid. Also offers a no-show action.
 */
export function PosPickupFulfillModal({
    order,
    canManage,
    isFulfillable,
    requiresPayment,
    isOnlineBlocked,
    submitting,
    actionPending,
    onConfirm,
    onMarkNotCollected,
    onClose,
}: PosPickupFulfillModalProps) {
    if (!order) return null;

    const total = Number(order.finalTotal);
    const customerName = order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : (order.guestName ?? 'Guest');
    const busy = submitting || actionPending;

    return (
        <Modal
            isOpen={!!order}
            onClose={onClose}
            title={`Pickup · ${order.orderCode}`}
            maxWidth="lg"
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                            status={order.status}
                            label={STAFF_ORDER_STATUS_LABEL[order.status]}
                        />
                        <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                    <span className="text-[11px] text-text-3">
                        {new Date(order.createdAt).toLocaleString()}
                    </span>
                </div>

                <p className="text-sm text-text-2">
                    {order.branch?.name ? `${order.branch.name} · ` : ''}
                    {customerName}
                </p>

                <OrderItemsList
                    items={order.items}
                    estimatedTotal={order.estimatedTotal}
                    loyaltyDiscountAmount={order.loyaltyDiscountAmount}
                    finalTotal={order.finalTotal}
                    note={order.note}
                />

                {isFulfillable ? (
                    <>
                        {requiresPayment ? (
                            <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary-soft p-3">
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-soft-text">
                                    <Banknote size={16} aria-hidden />
                                    Collect cash at till
                                </span>
                                <span className="mono text-sm font-bold text-primary-soft-text">
                                    {formatCurrency(total)}
                                </span>
                            </div>
                        ) : (
                            <div className="rounded-md border border-accent/40 bg-accent-soft p-3 text-sm text-accent-text">
                                Paid online — no tender needed.
                            </div>
                        )}

                        {canManage ? (
                            <div className="flex flex-col gap-2">
                                <Button
                                    size="lg"
                                    className="w-full"
                                    onClick={onConfirm}
                                    disabled={busy}
                                >
                                    {submitting
                                        ? 'Confirming…'
                                        : requiresPayment
                                          ? `Confirm & collect ${formatCurrency(total)}`
                                          : 'Confirm pickup'}
                                </Button>
                                <Button
                                    size="md"
                                    variant="danger"
                                    className="w-full"
                                    onClick={() => onMarkNotCollected(order.id)}
                                    disabled={busy}
                                >
                                    <Ban size={14} aria-hidden />
                                    Mark not collected
                                </Button>
                            </div>
                        ) : (
                            <p className="text-center text-xs text-text-3">
                                Only staff at this branch can collect this
                                order.
                            </p>
                        )}
                    </>
                ) : (
                    <div className="rounded-md border border-warning/40 bg-warning-soft p-3 text-sm text-warning">
                        {isOnlineBlocked
                            ? 'This online order is not paid yet — it cannot be collected.'
                            : `This order is ${
                                  STAFF_ORDER_STATUS_LABEL[order.status] ??
                                  order.status
                              } and cannot be collected.`}
                    </div>
                )}
            </div>
        </Modal>
    );
}
