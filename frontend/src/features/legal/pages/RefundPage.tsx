import { BUSINESS_INFO } from '@/config/business-info'
import { LEGAL_EFFECTIVE_DATE } from '../config/legal-pages'
import { LegalPage } from '../components/LegalPage'
import { LegalP, LegalSection, LegalTerm } from '../components/legal-prose'

const B = BUSINESS_INFO

export function RefundPage() {
    return (
        <LegalPage
            title="Refund, Return & Cancellation Policy"
            effectiveDate={LEGAL_EFFECTIVE_DATE}
            intro={`We want you to be happy with every order from ${B.tradeName}. This policy explains when you can cancel an order, return items, and how refunds work.`}
        >
            <LegalSection heading="1. Cancelling an order">
                <LegalP>
                    You may cancel an order at any time before it is collected (for
                    pickup) or dispatched (for delivery), and there is no charge
                    for doing so. To cancel, please contact us as early as possible
                    at {B.email} or {B.phone} with your order number.
                </LegalP>
                <LegalP>
                    Once an order has been collected or handed to the courier it
                    can no longer be cancelled — but the return and refund terms
                    below may still apply.
                </LegalP>
            </LegalSection>

            <LegalSection heading="2. Returns & refund eligibility">
                <LegalP>
                    You can return an item and request a refund or replacement if
                    it arrives damaged, spoiled, expired, or defective, if you
                    received the wrong item, or if an item you paid for was missing
                    from your order.
                </LegalP>
                <LegalP>
                    Please report any of these within <LegalTerm>24 hours</LegalTerm>{' '}
                    of pickup or delivery, quoting your order number and including a
                    photo where possible, so that we can verify the issue and put
                    it right quickly.
                </LegalP>
            </LegalSection>

            <LegalSection heading="3. Perishable & non-refundable items">
                <LegalP>
                    Because we sell groceries, some items have limited return
                    rights for health and safety reasons. Fresh, chilled, frozen,
                    and other perishable goods cannot be returned once they have
                    been collected or delivered, unless they were damaged, spoiled,
                    or expired at that time.
                </LegalP>
                <LegalP>
                    Similarly, products that have been opened or partially used
                    cannot be refunded except where there is a genuine quality
                    defect, and items sold as clearance or marked non-returnable
                    are final sale unless they are faulty.
                </LegalP>
            </LegalSection>

            <LegalSection heading="4. How refunds are paid">
                <LegalP>
                    Approved refunds for online payments are returned to your{' '}
                    <LegalTerm>original PayHere payment method</LegalTerm> — the
                    card or account you paid with. Refunds are normally processed
                    within 7–14 business days of approval, though your bank may
                    take a little longer to post them.
                </LegalP>
                <LegalP>
                    Where a loyalty discount or store credit was used on the order,
                    the corresponding value is restored to your account rather than
                    paid out in cash.
                </LegalP>
            </LegalSection>

            <LegalSection heading="5. Store-credit (khata) orders">
                <LegalP>
                    For orders placed on a store-credit account, an approved refund
                    reverses the corresponding amount on your account balance
                    instead of making a cash payout.
                </LegalP>
            </LegalSection>

            <LegalSection heading="6. Need help?">
                <LegalP>
                    Contact our team at {B.email} or {B.phone} ({B.hours}). We
                    review every request fairly and in line with {B.jurisdiction}{' '}
                    consumer law.
                </LegalP>
            </LegalSection>
        </LegalPage>
    )
}
