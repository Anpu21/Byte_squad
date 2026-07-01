import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';

export interface IPosBankTransferFormValues {
    bankTransferAmount: number;
    bankRef: string;
}

interface IPosBankTransferFormProps extends IPosBankTransferFormValues {
    onChange: (patch: Partial<IPosBankTransferFormValues>) => void;
}

/**
 * Bank-transfer tender form. The cashier types the wired amount and the
 * bank reference (the customer's transaction id) so the daily settlement
 * report can match the credit on the bank statement.
 */
export function PosBankTransferForm({
    bankTransferAmount,
    bankRef,
    onChange,
}: IPosBankTransferFormProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-medium text-text-2 mb-1.5">
                    Bank transfer amount
                </label>
                <PosCartNumericCell
                    value={bankTransferAmount}
                    onCommit={(next) =>
                        onChange({ bankTransferAmount: next })
                    }
                    min={0}
                    ariaLabel="Bank transfer amount"
                    className={cn(FIELD_SHELL, FIELD_BORDER, 'w-full h-[38px] px-3 tabular-nums')}
                />
            </div>

            <Input
                label="Bank reference"
                value={bankRef}
                onChange={(e) => onChange({ bankRef: e.target.value })}
                aria-label="Bank reference"
                placeholder="Transaction id or trace"
            />
        </div>
    );
}
