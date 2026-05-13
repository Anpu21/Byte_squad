import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusPill from '@/components/ui/StatusPill';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerOrder } from '@/types';
import type { Payment } from '../types/payment.type';
import { PaymentMethodPicker } from './PaymentMethodPicker';

interface OrderSummaryCardProps {
    request: ICustomerOrder;
    paymentMethod: Payment;
    onChangePayment: (p: Payment) => void;
    isFulfillable: boolean;
    requiresPayment: boolean;
    isOnlineBlocked: boolean;
    submitting: boolean;
    onConfirm: () => void;
    onReset: () => void;
}

export function OrderSummaryCard({
    request,
    paymentMethod,
    onChangePayment,
    isFulfillable,
    requiresPayment,
    isOnlineBlocked,
    submitting,
    onConfirm,
    onReset,
}: OrderSummaryCardProps) {
    const total = Number(request.finalTotal);
    const customerName = request.user
        ? `${request.user.firstName} ${request.user.lastName}`
        : (request.guestName ?? 'Guest');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-mono">{request.orderCode}</CardTitle>
                <StatusPill status={request.status} />
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-xs text-text-3">
                    {request.branch?.name} · {customerName} ·{' '}
                    {new Date(request.createdAt).toLocaleString()}
                </p>

                <div className="space-y-1.5 text-sm">
                    {request.items.map((it) => (
                        <div
                            key={it.id}
                            className="flex items-center justify-between text-text-1"
                        >
                            <span className="truncate pr-2">
                                {it.product?.name ?? 'Unknown'} × {it.quantity}
                            </span>
                            <span className="mono">
                                {formatCurrency(
                                    Number(it.unitPriceSnapshot) * it.quantity,
                                )}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-text-3">
                        Final total
                    </span>
                    <span className="text-lg font-bold text-text-1 mono">
                        {formatCurrency(total)}
                    </span>
                </div>

                {isFulfillable ? (
                    <>
                        {requiresPayment ? (
                            <PaymentMethodPicker
                                value={paymentMethod}
                                onChange={onChangePayment}
                            />
                        ) : (
                            <div className="p-3 rounded-md bg-accent-soft border border-accent/40 text-sm text-accent-text">
                                Online payment is already confirmed.
                            </div>
                        )}

                        <Button
                            type="button"
                            onClick={onConfirm}
                            disabled={submitting}
                            className="w-full"
                            size="lg"
                        >
                            {submitting
                                ? 'Confirming...'
                                : requiresPayment
                                  ? `Confirm & charge ${formatCurrency(total)}`
                                  : 'Confirm pickup'}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onReset}
                            className="w-full"
                        >
                            Scan another
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="p-3 rounded-md bg-warning-soft border border-warning/40 text-sm text-warning">
                            {isOnlineBlocked
                                ? 'This online order is not paid yet.'
                                : `This order is ${request.status} and cannot be fulfilled.`}
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onReset}
                            className="w-full"
                        >
                            Scan another
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
