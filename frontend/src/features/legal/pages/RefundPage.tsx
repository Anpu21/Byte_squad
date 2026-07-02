import { BUSINESS_INFO } from '@/config/business-info'
import { LEGAL_EFFECTIVE_DATE } from '../config/legal-pages'
import { LegalPage } from '../components/LegalPage'
import { LegalList, LegalP, LegalSection, LegalTerm } from '../components/legal-prose'

const B = BUSINESS_INFO

export function RefundPage() {
    return (
        <LegalPage
            title="Refund, Return & Cancellation Policy"
            effectiveDate={LEGAL_EFFECTIVE_DATE}
            intro={`We want you to be happy with every order from ${B.tradeName}. This policy explains when you can cancel an order, return items, and how refunds work.`}
        >
            <LegalSection heading="1. Cancelling an order">
                <LegalList
                    items={[
                        'You may cancel an order any time before it is collected (for pickup) or dispatched (for delivery), at no charge.',
                        'To cancel, contact us as early as possible at ' + B.email + ' or ' + B.phone + ' with your order number.',
                        'Once an order is collected or handed to the courier, it can no longer be cancelled — but the Refund section below may still apply.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="2. Returns & refund eligibility">
                <LegalP>
                    You can return an item and request a refund or replacement if:
                </LegalP>
                <LegalList
                    items={[
                        'An item is damaged, spoiled, expired, or defective on arrival;',
                        'You received the wrong item; or',
                        'An item you paid for was missing from your order.',
                    ]}
                />
                <LegalP>
                    Please report these within{' '}
                    <LegalTerm>24 hours</LegalTerm> of pickup or delivery, with
                    your order number and a photo where possible, so we can verify
                    and resolve it quickly.
                </LegalP>
            </LegalSection>

            <LegalSection heading="3. Perishable & non-refundable items">
                <LegalP>
                    Because we sell groceries, some items have limited
                    return rights for health and safety reasons:
                </LegalP>
                <LegalList
                    items={[
                        'Fresh, chilled, frozen, or other perishable goods cannot be returned once collected/delivered unless they were damaged, spoiled, or expired at that time.',
                        'Opened or partially used products cannot be refunded except for a genuine quality defect.',
                        'Items sold as clearance or marked non-returnable are final sale unless faulty.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="4. How refunds are paid">
                <LegalList
                    items={[
                        <>
                            Approved refunds for online payments are returned to
                            your <LegalTerm>original PayHere payment method</LegalTerm>{' '}
                            (the card or account you paid with).
                        </>,
                        'Refunds are typically processed within 7–14 business days after approval; your bank may take additional time to post them.',
                        'Where a loyalty discount or store credit was used, the corresponding value is restored to your account rather than paid in cash.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="5. Store-credit (khata) orders">
                <LegalP>
                    For orders placed on a store-credit account, an approved
                    refund reverses the corresponding amount on your account
                    balance instead of a cash payout.
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
