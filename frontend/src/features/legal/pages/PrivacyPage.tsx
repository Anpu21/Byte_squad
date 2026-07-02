import { BUSINESS_INFO } from '@/config/business-info'
import { LEGAL_EFFECTIVE_DATE } from '../config/legal-pages'
import { LegalPage } from '../components/LegalPage'
import { LegalList, LegalP, LegalSection, LegalTerm } from '../components/legal-prose'

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
                    responsible for the personal data described here. Contact us
                    at {B.email} or {B.phone} for any privacy request.
                </LegalP>
            </LegalSection>

            <LegalSection heading="2. What we collect">
                <LegalList
                    items={[
                        'Account details — name, email, phone, and password.',
                        'Order details — items, pickup branch or delivery address, and order history.',
                        'Payment metadata — confirmation, amount, and status from PayHere. We do NOT collect or store your full card number.',
                        'Loyalty & store-credit activity where you use those programmes.',
                        'Technical data — device, browser, and usage information collected via cookies and similar tools to keep the site working and secure.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="3. How we use it">
                <LegalList
                    items={[
                        'To process and fulfil your orders (pickup or delivery) and take payment.',
                        'To manage your account, loyalty points, and any store-credit facility.',
                        'To provide support and send service messages about your orders.',
                        'To prevent fraud, secure the service, and meet legal obligations.',
                        'To improve our products and store experience.',
                    ]}
                />
            </LegalSection>

            <LegalSection heading="4. Who we share it with">
                <LegalP>
                    We share data only as needed to run the store:
                </LegalP>
                <LegalList
                    items={[
                        <>
                            <LegalTerm>PayHere</LegalTerm> — to process payments
                            securely. PayHere handles your card data under its own
                            privacy terms and PCI-DSS compliance.
                        </>,
                        'Delivery / courier partners — the name, address, and phone needed to deliver your order.',
                        'Service providers (e.g. hosting, email) acting on our instructions.',
                        'Authorities where required by law.',
                    ]}
                />
                <LegalP>We do not sell your personal data.</LegalP>
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
