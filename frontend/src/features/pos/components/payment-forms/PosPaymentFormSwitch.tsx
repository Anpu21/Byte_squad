import type { TPaymentMethod } from '@/types';
import { PosCashTenderForm } from './PosCashTenderForm';
import { PosChequeForm } from './PosChequeForm';
import { PosBankTransferForm } from './PosBankTransferForm';
import type { ITenderBag } from './pos-payment-forms.helpers';

interface IPosPaymentFormSwitchProps {
    paymentMethod: TPaymentMethod;
    invoiceTotal: number;
    bag: ITenderBag;
    onPatchBag: (patch: Partial<ITenderBag>) => void;
}

/**
 * Pure router — picks the right tender form for the active method. Card
 * and Mobile share a "no form" placeholder because both record the full
 * invoice total against the chosen method with no extra fields. The
 * Credit tender is no longer exposed in the cashier UI (single-shop
 * retail has no walk-in customer accounts), so the Credit branch falls
 * through to the same external-tender placeholder.
 */
export function PosPaymentFormSwitch({
    paymentMethod,
    invoiceTotal,
    bag,
    onPatchBag,
}: IPosPaymentFormSwitchProps) {
    if (paymentMethod === 'Cash') {
        return (
            <PosCashTenderForm
                invoiceTotal={invoiceTotal}
                cashTendered={bag.cashTendered}
                onCashTenderedChange={(next) =>
                    onPatchBag({ cashTendered: next })
                }
            />
        );
    }
    if (paymentMethod === 'Cheque') {
        return (
            <PosChequeForm
                chequeAmount={bag.chequeAmount}
                chequeNo={bag.chequeNo}
                chequeDate={bag.chequeDate}
                chequeBank={bag.chequeBank}
                chequeBranch={bag.chequeBranch}
                chequeRef={bag.chequeRef}
                chequeDeliveredBy={bag.chequeDeliveredBy}
                onChange={onPatchBag}
            />
        );
    }
    if (paymentMethod === 'Bank') {
        return (
            <PosBankTransferForm
                bankTransferAmount={bag.bankTransferAmount}
                bankRef={bag.bankRef}
                onChange={onPatchBag}
            />
        );
    }
    // Card / Mobile / Credit: external tender; cashier verifies receipt elsewhere.
    return (
        <div
            role="note"
            className="rounded-md border border-border bg-surface-2 px-3 py-3 text-[12px] text-text-2"
        >
            Verify the {paymentMethod.toLowerCase()} payment was received
            externally, then press Charge. The full invoice total will be
            recorded against this method.
        </div>
    );
}
