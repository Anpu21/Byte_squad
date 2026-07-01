import type { usePosCart } from '../../hooks/usePosCart';
import type { usePosPageState } from '../../hooks/usePosPageState';
import type { usePosCheckout } from '../../hooks/usePosCheckout';
import type { usePosLoyaltySettings } from '../../hooks/usePosLoyaltySettings';
import { PosLoyaltyCard } from '../loyalty-card/PosLoyaltyCard';
import { PosCreditAccountCard } from '../credit-card/PosCreditAccountCard';
import { PosBillLivePreview } from '../bill-live-preview/PosBillLivePreview';
import { PosCreditTenderPanel } from '../credit-card/PosCreditTenderPanel';
import { PosCashTenderForm } from '../payment-forms/PosCashTenderForm';
import { PosPaymentBanners } from '../payment-forms/PosPaymentBanners';
import { PosActionButtons } from '../action-buttons/PosActionButtons';

interface PosCheckoutSidebarProps {
    cart: ReturnType<typeof usePosCart>;
    state: ReturnType<typeof usePosPageState>;
    checkout: ReturnType<typeof usePosCheckout>;
    loyaltySettings: ReturnType<typeof usePosLoyaltySettings>['data'];
    previewInvoiceNumber: string;
}

/** Right rail: loyalty + credit cards, live preview, tender forms, actions. */
export function PosCheckoutSidebar({
    cart,
    state,
    checkout,
    loyaltySettings,
    previewInvoiceNumber,
}: PosCheckoutSidebarProps) {
    const { creditAccount, calc, submit } = checkout;
    return (
        <div className="flex flex-col gap-3">
            <PosLoyaltyCard
                loyaltyOwner={state.loyaltyOwner}
                onAttach={state.setLoyaltyOwner}
                onDetach={() => state.setLoyaltyOwner(null)}
                redeemPoints={state.loyaltyRedeemPoints}
                onRedeemChange={state.setLoyaltyRedeemPoints}
                maxRedeemable={checkout.loyaltyRedeem.maxRedeemable}
            />
            <PosCreditAccountCard
                creditAccount={state.creditAccount}
                onAttach={state.setCreditAccount}
                onDetach={() => state.setCreditAccount(null)}
            />
            <PosBillLivePreview
                cart={cart.cart}
                invoiceNumber={previewInvoiceNumber}
                cartDiscountPercentage={state.cartDiscountPercentage}
                loyaltyOwner={state.loyaltyOwner}
                loyaltyRedeemPoints={state.loyaltyRedeemPoints}
                loyaltySettings={loyaltySettings ?? null}
            />
            {cart.cart.length > 0 && (
                <>
                    {creditAccount && (
                        <PosCreditTenderPanel
                            method={checkout.paymentMethod}
                            onMethodChange={checkout.setPaymentMethod}
                            account={creditAccount}
                            amount={checkout.invoiceTotal}
                            override={state.creditOverride}
                            onRequestOverride={() =>
                                checkout.setShowOverride(true)
                            }
                        />
                    )}
                    {!checkout.onCredit && (
                        <PosCashTenderForm
                            invoiceTotal={checkout.payableByMoney}
                            cashTendered={checkout.cashTendered}
                            onCashTenderedChange={checkout.setCashTendered}
                            loyaltyRedeemValue={checkout.loyaltyRedeem.redeemValue}
                        />
                    )}
                    <PosPaymentBanners
                        hasMultiTenderError={checkout.hasError}
                        mutationError={submit.error}
                    />
                </>
            )}
            <PosActionButtons
                onFocusSearch={state.focusSearch}
                onClearCart={cart.clear}
                onPrintLastReceipt={checkout.handlePrintLast}
                onShowRecent={state.openRecent}
                onCharge={() => calc && submit.handleCharge(calc.paymentAmount)}
                disableCharge={checkout.disableCharge}
                isCartEmpty={cart.cart.length === 0}
                hasLastReceipt={state.lastSale !== null}
            />
        </div>
    );
}
