import type { TPaymentMethod } from '@/types';
import { PosCashTenderForm } from './PosCashTenderForm';
import type { ITenderBag } from './pos-payment-forms.helpers';

interface IPosPaymentFormSwitchProps {
    paymentMethod: TPaymentMethod;
    invoiceTotal: number;
    bag: ITenderBag;
    onPatchBag: (patch: Partial<ITenderBag>) => void;
}

/**
 * Pure router — picks the right tender form for the active method. Cash
 * shows the tender/change form; Card (settled via PayHere) and Credit
 * (khata) are external tenders that record the full invoice total with no
 * extra fields, so they share the placeholder note below.
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
    // Card / Credit: external tender; cashier verifies receipt elsewhere.
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
