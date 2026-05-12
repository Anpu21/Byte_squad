import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusPill from '@/components/ui/StatusPill';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerRequest } from '@/types';
import type { Payment } from '../types/payment.type';
import { PaymentMethodPicker } from './PaymentMethodPicker';

interface RequestSummaryCardProps {
    request: ICustomerRequest;
    paymentMethod: Payment;
    onChangePayment: (p: Payment) => void;
    isFulfillable: boolean;
    submitting: boolean;
    onConfirm: () => void;
    onReset: () => void;
}

export function RequestSummaryCard({
    request,
    paymentMethod,
    onChangePayment,
    isFulfillable,
    submitting,
    onConfirm,
    onReset,
}: RequestSummaryCardProps) {
    const total = Number(request.estimatedTotal);
    const customerName = request.user
        ? `${request.user.firstName} ${request.user.lastName}`
        : (request.guestName ?? 'Guest');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-mono">{request.requestCode}</CardTitle>
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
                        Estimated total
                    </span>
                    <span className="text-lg font-bold text-text-1 mono">
                        {formatCurrency(total)}
                    </span>
                </div>

                {isFulfillable ? (
                    <>
                        <PaymentMethodPicker
                            value={paymentMethod}
                            onChange={onChangePayment}
                        />

                        <Button
                            type="button"
                            onClick={onConfirm}
                            disabled={submitting}
                            className="w-full"
                            size="lg"
                        >
                            {submitting
                                ? 'Charging…'
                                : `Confirm & charge ${formatCurrency(total)}`}
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
                            This request is {request.status} and cannot be charged.
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
