import { BUSINESS_INFO } from '@/config/business-info'
import { LEGAL_EFFECTIVE_DATE } from '../config/legal-pages'
import { LegalPage } from '../components/LegalPage'
import { LegalP, LegalSection, LegalTerm } from '../components/legal-prose'

const B = BUSINESS_INFO

export function PrivacyPage() {
    return (
        <LegalPage
            title="Privacy Policy"
            effectiveDate={LEGAL_EFFECTIVE_DATE}
            intro={`This policy explains what personal data ${B.tradeName} collects, why we collect it, and the choices you have.`}
        >
            <LegalSection heading="1. Who controls your data">
                <LegalP>
                    <LegalTerm>{B.legalName}</LegalTerm> ({B.address}) is
                    responsible for the personal data described here. You can
                    contact us at {B.email} or {B.phone} for any privacy request.
                </LegalP>
            </LegalSection>

            <LegalSection heading="2. What we collect">
                <LegalP>
                    We collect the account details you give us — your name, email,
                    phone number, and password — together with the details of the
                    orders you place, including the items, your chosen pickup
                    branch or delivery address, and your order history.
                </LegalP>
                <LegalP>
                    When you pay online we receive payment metadata from PayHere,
                    such as the confirmation, amount, and status. We do{' '}
                    <LegalTerm>not</LegalTerm> collect or store your full card
                    number. Where you use them, we also hold your loyalty and
                    store-credit activity, and we collect limited technical data —
                    device, browser, and usage information — through cookies and
                    similar tools to keep the site working and secure.
                </LegalP>
            </LegalSection>

            <LegalSection heading="3. How we use it">
                <LegalP>
                    We use your data to process and fulfil your orders, whether for
                    pickup or delivery, and to take payment for them. It also lets
                    us manage your account, loyalty points, and any store-credit
                    facility, provide support, and send you service messages about
                    your orders.
                </LegalP>
                <LegalP>
                    Beyond that, we use data to prevent fraud, keep the service
                    secure, meet our legal obligations, and improve our products
                    and the overall store experience.
                </LegalP>
            </LegalSection>

            <LegalSection heading="4. Who we share it with">
                <LegalP>
                    We share data only as far as we need to in order to run the
                    store. Payments are handled by <LegalTerm>PayHere</LegalTerm>,
                    which processes your card data securely under its own privacy
                    terms and PCI-DSS compliance. When your order is delivered, we
                    pass our delivery or courier partners the name, address, and
                    phone number needed to complete the delivery.
                </LegalP>
                <LegalP>
                    We also rely on service providers — such as hosting and email
                    providers — who act on our instructions, and we may disclose
                    data to authorities where the law requires it. We do not sell
                    your personal data.
                </LegalP>
            </LegalSection>

            <LegalSection heading="5. Cookies">
                <LegalP>
                    We use essential cookies to keep you signed in and your cart
                    intact, and limited analytics to understand usage. You can
                    control cookies through your browser; disabling essential
                    cookies may break parts of the store.
                </LegalP>
            </LegalSection>

            <LegalSection heading="6. Retention & security">
                <LegalP>
                    We keep personal data only as long as needed for the purposes
                    above or as the law requires, and we apply reasonable
                    technical and organisational measures to protect it.
                </LegalP>
            </LegalSection>

            <LegalSection heading="7. Your rights">
                <LegalP>
                    You may request access to, correction of, or deletion of your
                    personal data, and you may object to certain uses. Email{' '}
                    {B.email} and we will respond in line with {B.jurisdiction}{' '}
                    law.
                </LegalP>
            </LegalSection>

            <LegalSection heading="8. Changes">
                <LegalP>
                    We may update this policy; the effective date above shows the
                    current version. Material changes will be highlighted on this
                    page.
                </LegalP>
            </LegalSection>
        </LegalPage>
    )
}
