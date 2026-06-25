import Input from '@/components/ui/Input';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';

export interface IPosChequeFormValues {
    chequeAmount: number;
    chequeNo: string;
    /** ISO date string from <input type="date">; empty when unset. */
    chequeDate: string;
    chequeBank: string;
    chequeBranch: string;
    chequeRef: string;
    chequeDeliveredBy: string;
}

interface IPosChequeFormProps extends IPosChequeFormValues {
    onChange: (patch: Partial<IPosChequeFormValues>) => void;
}

/**
 * Cheque tender form. The cashier records the cheque metadata alongside
 * the amount so the bank-reconciliation report can match the deposit. All
 * fields except `chequeAmount` are free-form strings; the orchestrator
 * sends them straight through to the backend's `CreateSalePaymentDto`.
 *
 * The component is a pure-presentational form — every field calls
 * `onChange` with a narrow patch so the parent can hold the whole bag in
 * one state slot and detect dirty/clean state cheaply.
 */
export function PosChequeForm({
    chequeAmount,
    chequeNo,
    chequeDate,
    chequeBank,
    chequeBranch,
    chequeRef,
    chequeDeliveredBy,
    onChange,
}: IPosChequeFormProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label className="block text-xs font-medium text-text-2 mb-1.5">
                    Cheque amount
                </label>
                <PosCartNumericCell
                    value={chequeAmount}
                    onCommit={(next) => onChange({ chequeAmount: next })}
                    min={0}
                    ariaLabel="Cheque amount"
                    className="w-full h-[38px] px-3 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 tabular-nums outline-none transition-colors focus:border-focus focus:ring-[3px] focus:ring-primary/30"
                />
            </div>

            <Input
                label="Cheque number"
                value={chequeNo}
                onChange={(e) => onChange({ chequeNo: e.target.value })}
                aria-label="Cheque number"
                placeholder="e.g. 240518"
            />

            <Input
                label="Cheque date"
                type="date"
                value={chequeDate}
                onChange={(e) => onChange({ chequeDate: e.target.value })}
                aria-label="Cheque date"
            />

            <Input
                label="Bank"
                value={chequeBank}
                onChange={(e) => onChange({ chequeBank: e.target.value })}
                aria-label="Bank"
                placeholder="e.g. Sampath"
            />

            <Input
                label="Branch"
                value={chequeBranch}
                onChange={(e) => onChange({ chequeBranch: e.target.value })}
                aria-label="Branch"
                placeholder="e.g. Colombo 03"
            />

            <Input
                label="Reference"
                value={chequeRef}
                onChange={(e) => onChange({ chequeRef: e.target.value })}
                aria-label="Reference"
                placeholder="Optional"
            />

            <div className="sm:col-span-2">
                <Input
                    label="Delivered by"
                    value={chequeDeliveredBy}
                    onChange={(e) =>
                        onChange({ chequeDeliveredBy: e.target.value })
                    }
                    aria-label="Delivered by"
                    placeholder="Name on the cheque drop"
                />
            </div>
        </div>
    );
}
