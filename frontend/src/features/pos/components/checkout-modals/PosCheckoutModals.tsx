import type { ISale } from '@/types';
import type { usePosPageState } from '../../hooks/usePosPageState';
import type { usePosCheckout } from '../../hooks/usePosCheckout';
import type { usePosHeldBills } from '../../hooks/usePosHeldBills';
import { PosRecentSaleSidebar } from '../recent-sale/PosRecentSaleSidebar';
import { PosBillPreviewModal } from '../bill-template/PosBillPreviewModal';
import { PosHeldBillsModal } from '../held-bills/PosHeldBillsModal';
import { PosReturnModal } from '../returns/PosReturnModal';
import { PosManagerOverrideModal } from '../credit-card/PosManagerOverrideModal';
import { PosPrintHost } from '../bill-template/PosPrintHost';

interface PosCheckoutModalsProps {
    state: ReturnType<typeof usePosPageState>;
    checkout: ReturnType<typeof usePosCheckout>;
    heldBills: ReturnType<typeof usePosHeldBills>;
    previewSale: ISale | null;
    printingSale: ISale | null;
    showHeldBills: boolean;
    onCloseHeldBills: () => void;
    onResumeHeldBill: (id: string) => void;
    showReturn: boolean;
    onCloseReturn: () => void;
}

/** All POS overlays: recent sales, bill preview, held bills, return, override. */
export function PosCheckoutModals({
    state,
    checkout,
    heldBills,
    previewSale,
    printingSale,
    showHeldBills,
    onCloseHeldBills,
    onResumeHeldBill,
    showReturn,
    onCloseReturn,
}: PosCheckoutModalsProps) {
    const { creditAccount } = checkout;
    return (
        <>
            <PosRecentSaleSidebar
                isOpen={state.showRecent}
                onClose={state.closeRecent}
                onSelectSale={state.setPreviewSaleId}
            />
            <PosBillPreviewModal
                isOpen={state.previewSaleId !== null}
                sale={previewSale}
                onClose={() => state.setPreviewSaleId(null)}
            />
            <PosHeldBillsModal
                isOpen={showHeldBills}
                onClose={onCloseHeldBills}
                heldBills={heldBills.heldBills}
                onResume={onResumeHeldBill}
                onDiscard={heldBills.discardBill}
            />
            <PosReturnModal isOpen={showReturn} onClose={onCloseReturn} />
            {creditAccount && (
                <PosManagerOverrideModal
                    isOpen={checkout.showOverride}
                    onClose={() => checkout.setShowOverride(false)}
                    account={creditAccount}
                    amount={checkout.invoiceTotal}
                    onAuthorized={(token, amount) =>
                        state.setCreditOverride({ token, amount })
                    }
                />
            )}
            <PosPrintHost sale={printingSale} />
        </>
    );
}
