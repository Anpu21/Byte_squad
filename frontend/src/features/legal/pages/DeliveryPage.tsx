import { BUSINESS_INFO } from '@/config/business-info'
import { LEGAL_EFFECTIVE_DATE } from '../config/legal-pages'
import { LegalPage } from '../components/LegalPage'
import { LegalP, LegalSection, LegalTerm } from '../components/legal-prose'

const B = BUSINESS_INFO

export function DeliveryPage() {
    return (
        <LegalPage
            title="Delivery & Pickup Policy"
            effectiveDate={LEGAL_EFFECTIVE_DATE}
            intro={`${B.tradeName} lets you collect your order at a branch or have it delivered. Here's how each option works.`}
        >
            <LegalSection heading="1. Branch pickup">
                <LegalP>
                    Choose your preferred branch at checkout, and we will prepare
                    your order and notify you when it is ready to collect. When you
                    come to collect, please bring your order number along with the
                    confirmation code or QR shown on your order.
                </LegalP>
                <LegalP>
                    Pickup is free. Please collect within the window shown on your
                    order so that your items — especially fresh goods — stay in
                    good condition.
                </LegalP>
            </LegalSection>

            <LegalSection heading="2. Delivery">
                <LegalP>
                    Where delivery is available for your area, enter your delivery
                    address at checkout to see availability and any delivery charge
                    before you pay. Deliveries are handled by our own staff or by
                    trusted courier partners, and the estimated timeline shown at
                    checkout depends on your location and the size of your order.
                </LegalP>
                <LegalP>
                    Please make sure someone is available at the address to receive
                    the order. If a delivery cannot be completed after reasonable
                    attempts, we will contact you to rearrange it.
                </LegalP>
            </LegalSection>

            <LegalSection heading="3. Delivery areas & charges">
                <LegalP>
                    Delivery coverage and fees vary by branch and location. The
                    exact charge, if any, is always shown at checkout before
                    payment — you will never be charged a delivery fee you
                    haven&apos;t seen and confirmed. All charges are in{' '}
                    <LegalTerm>{B.currency}</LegalTerm>.
                </LegalP>
            </LegalSection>

            <LegalSection heading="4. Timelines">
                <LegalP>
                    Estimated pickup-ready and delivery times are provided in good
                    faith and may vary with demand, weather, stock, and traffic.
                    We will keep you informed if there is a significant delay.
                </LegalP>
            </LegalSection>

            <LegalSection heading="5. Checking your order">
                <LegalP>
                    Please check your items at pickup or on delivery. If anything
                    is missing, damaged, or incorrect, tell us within 24 hours so
                    we can put it right under our Refund, Return &amp; Cancellation
                    Policy.
                </LegalP>
            </LegalSection>

            <LegalSection heading="6. Questions">
                <LegalP>
                    For anything about pickup or delivery, contact {B.email} or{' '}
                    {B.phone} ({B.hours}).
                </LegalP>
            </LegalSection>
        </LegalPage>
    )
}
