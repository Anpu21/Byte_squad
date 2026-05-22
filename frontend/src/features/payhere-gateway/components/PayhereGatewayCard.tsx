import type { RefObject } from 'react';
import { X } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { PayhereRedirectForm } from '@/features/checkout/components/PayhereRedirectForm';
import type { GatewayState } from '../types';

interface PayhereGatewayCardProps {
    state: GatewayState;
    formRef: RefObject<HTMLFormElement | null>;
    secondsLeft: number;
    onCancel: () => void;
}

export function PayhereGatewayCard({
    state,
    formRef,
    secondsLeft,
    onCancel,
}: PayhereGatewayCardProps) {
    const itemLabel =
        state.itemCount === 1 ? '1 item' : `${state.itemCount} items`;

    return (
        <div className="max-w-md mx-auto mt-16">
            <div className="bg-surface border border-border rounded-lg shadow-md-token p-8 text-center">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>

                <p className="text-text-2 text-sm mb-6">
                    Securely redirecting to PayHere&hellip;
                </p>

                <div
                    role="status"
                    aria-label="Redirecting"
                    className="flex justify-center mb-6"
                >
                    <div className="w-10 h-10 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                </div>

                <p className="text-text-1 font-semibold mb-1">
                    Paying {formatCurrency(state.finalTotal)} for{' '}
                    {state.orderCode}
                </p>
                <p className="text-text-2 text-xs mb-6">
                    {itemLabel} &middot; Pickup at {state.branchName}
                </p>

                <p
                    className="text-text-3 text-xs mb-6"
                    aria-live="polite"
                >
                    Redirecting in {secondsLeft}&hellip;
                </p>

                <div className="border-t border-border pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="w-full"
                    >
                        <X size={14} /> Cancel and view order
                    </Button>
                </div>

                <PayhereRedirectForm ref={formRef} payment={state.payment} />
            </div>
        </div>
    );
}
