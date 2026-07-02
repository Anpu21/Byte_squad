import { BUSINESS_INFO } from '@/config/business-info'
import { LEGAL_EFFECTIVE_DATE } from '../config/legal-pages'
import { LegalPage } from '../components/LegalPage'
import { LegalP, LegalSection, LegalTerm } from '../components/legal-prose'

const B = BUSINESS_INFO

export function TermsPage() {
    return (
        <LegalPage
            title="Terms & Conditions"
            effectiveDate={LEGAL_EFFECTIVE_DATE}
            intro={`These Terms govern your use of the ${B.tradeName} online store and the orders you place with us. By creating an account, placing an order, or making a payment, you agree to these Terms.`}
        >
            <LegalSection heading="1. Who we are">
                <LegalP>
                    This store is operated by <LegalTerm>{B.legalName}</LegalTerm>,
                    a business based in {B.jurisdiction} at {B.address}. You can
                    reach us at {B.email} or {B.phone}.
                </LegalP>
            </LegalSection>

            <LegalSection heading="2. Your account">
                <LegalP>
                    When you register, you agree to provide accurate details and
                    to keep your login credentials secure. You are responsible for
                    all activity that takes place under your account, so please
                    tell us immediately if you believe it has been used without
                    your permission. To place an order you must be able to form a
                    legally binding contract with us.
                </LegalP>
            </LegalSection>

            <LegalSection heading="3. Orders & pricing">
                <LegalP>
                    All prices are shown in {B.currency} and include any applicable
                    taxes unless we state otherwise. When you place an order you
                    are making an offer to buy; that offer is accepted only once we
                    confirm the order and, for prepaid orders, once your payment
                    has been received.
                </LegalP>
                <LegalP>
                    We may decline or cancel an order — for example where an item
                    is out of stock, has been mispriced, or the order appears
                    fraudulent — and in that case we will refund any amount you
                    have already paid. Product images and descriptions are provided
                    for reference only, and packaging and availability may vary
                    from one branch to another.
                </LegalP>
            </LegalSection>

            <LegalSection heading="4. Payment">
                <LegalP>
                    Card and online payments are processed securely by{' '}
                    <LegalTerm>PayHere</LegalTerm>, our third-party payment
                    gateway. We never see or store your full card details. By
                    paying, you also agree to PayHere&apos;s terms. If a payment
                    fails or is reversed, we may hold or cancel the related order.
                </LegalP>
            </LegalSection>

            <LegalSection heading="5. Pickup & delivery">
                <LegalP>
                    You may collect your order at your chosen branch or, where
                    available, have it delivered. Fulfilment timelines, areas, and
                    charges are set out in our Delivery &amp; Pickup Policy.
                </LegalP>
            </LegalSection>

            <LegalSection heading="6. Returns, cancellations & refunds">
                <LegalP>
                    Cancellations, returns, and refunds are governed by our
                    Refund, Return &amp; Cancellation Policy. Perishable goods
                    carry specific conditions described there.
                </LegalP>
            </LegalSection>

            <LegalSection heading="7. Loyalty points & store credit">
                <LegalP>
                    Loyalty points have no cash value, are non-transferable, and
                    may expire or be adjusted under the loyalty programme rules.
                    Store-credit (&quot;khata&quot;) accounts are offered at our
                    discretion and are subject to separate credit terms and
                    repayment obligations.
                </LegalP>
            </LegalSection>

            <LegalSection heading="8. Acceptable use">
                <LegalP>
                    You agree not to misuse the store, interfere with its
                    operation, or use it for unlawful purposes. We may suspend or
                    close accounts that breach these Terms.
                </LegalP>
            </LegalSection>

            <LegalSection heading="9. Changes & governing law">
                <LegalP>
                    We may update these Terms from time to time; the effective
                    date above reflects the current version. These Terms are
                    governed by the laws of {B.jurisdiction}, and any disputes are
                    subject to its courts. Questions? Email {B.email}.
                </LegalP>
            </LegalSection>
        </LegalPage>
    )
}
