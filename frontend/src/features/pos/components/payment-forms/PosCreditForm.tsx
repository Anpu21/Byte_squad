import { UserPlus } from 'lucide-react';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';

interface IPosCreditFormProps {
    customerUserId: string | null;
    creditAmount: number;
    onCreditAmountChange: (next: number) => void;
}

/**
 * Customer-credit tender form. Gated on a customer being attached to the
 * sale — credit balances live on the User row, so a walk-in customer has
 * nowhere to charge against.
 *
 * When no customer is attached we render an inline pointer to the
 * customer card instead of disabling the input silently, so the cashier
 * doesn't have to guess what the empty form means.
 */
export function PosCreditForm({
    customerUserId,
    creditAmount,
    onCreditAmountChange,
}: IPosCreditFormProps) {
    if (!customerUserId) {
        return (
            <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning-soft px-3 py-3 text-text-1"
            >
                <UserPlus
                    size={18}
                    aria-hidden
                    className="mt-0.5 text-warning shrink-0"
                />
                <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-semibold">
                        Select a customer to use credit
                    </span>
                    <span className="text-[12px] text-text-2">
                        Open the Customer card and attach a registered
                        customer before charging against credit.
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="block text-xs font-medium text-text-2">
                Credit amount
            </label>
            <PosCartNumericCell
                value={creditAmount}
                onCommit={onCreditAmountChange}
                min={0}
                step={1}
                ariaLabel="Credit amount"
                className="w-full h-[42px] px-3 bg-surface border border-border-strong rounded-md text-[14px] text-text-1 tabular-nums outline-none transition-colors focus:border-primary focus:ring-[3px] focus:ring-primary/30"
            />
            <p className="text-[11px] text-text-3">
                Adds the amount to the customer's outstanding balance.
                Combine with cash/cheque/bank to clear part of the bill.
            </p>
        </div>
    );
}
