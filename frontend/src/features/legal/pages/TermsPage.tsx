import { BUSINESS_INFO } from '@/config/business-info'
import { LEGAL_EFFECTIVE_DATE } from '../config/legal-pages'
import { LegalPage } from '../components/LegalPage'
import {
    LegalList,
    LegalP,
    LegalSection,
    LegalTerm,
} from '../components/legal-prose'

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
                <LegalList
                    items={[
                        'You must provide accurate registration details and keep your login credentials secure.',
                        'You are responsible for activity on your account. Tell us immediately if you suspect unauthorised use.',
                        'You must be able to form a legally binding contract to place an order.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="3. Orders & pricing">
                <LegalList
                    items={[
                        `All prices are shown in ${B.currency} and include applicable taxes unless stated otherwise.`,
                        'An order is an offer to buy. It is accepted only when we confirm it and, for prepaid orders, when payment is received.',
                        'We may decline or cancel an order — for example if an item is out of stock, mispriced, or the order appears fraudulent — and will refund any amount already paid.',
                        'Product images and descriptions are for reference; packaging and availability may vary by branch.',
                    ]}
                />
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

            <LegalSection heading="6. Cancellations & refunds">
                <LegalP>
                    Cancellations, returns, and refunds are governed by our
                    Refund &amp; Cancellation Policy. Perishable goods carry
                    specific conditions described there.
                </LegalP>
            </LegalSection>

            <LegalSection heading="7. Loyalty points & store credit">
                <LegalList
                    items={[
                        'Loyalty points have no cash value, are non-transferable, and may expire or be adjusted under the loyalty programme rules.',
                        'Store-credit ("khata") accounts are offered at our discretion and are subject to separate credit terms and repayment obligations.',
                    ]}
                />
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
