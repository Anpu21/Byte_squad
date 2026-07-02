import { BUSINESS_INFO } from '@/config/business-info'
import { LEGAL_EFFECTIVE_DATE } from '../config/legal-pages'
import { LegalPage } from '../components/LegalPage'
import { LegalP, LegalSection, LegalTerm } from '../components/legal-prose'

const B = BUSINESS_INFO

export function BusinessTermsPage() {
    return (
        <LegalPage
            title="Business & Legal Terms (Terms of Use)"
            effectiveDate={LEGAL_EFFECTIVE_DATE}
            intro={`These Terms of Use cover the legal basis on which ${B.tradeName} provides this website — your rights to use it, our intellectual property, and the limits of our liability. They sit alongside our customer Terms & Conditions, which govern your purchases.`}
        >
            <LegalSection heading="1. Acceptance">
                <LegalP>
                    By accessing this website you agree to these Terms of Use. If
                    you do not agree, please do not use the site. The site is
                    operated by <LegalTerm>{B.legalName}</LegalTerm> ({B.address}).
                </LegalP>
            </LegalSection>

            <LegalSection heading="2. Acceptable use">
                <LegalP>
                    You agree not to use the site for any unlawful, fraudulent, or
                    harmful purpose, and not to attempt to gain unauthorised access
                    to accounts, systems, or data. You must not interfere with,
                    disrupt, or overload the site or its security features, and you
                    may not copy, scrape, or resell site content or data without
                    our written permission.
                </LegalP>
            </LegalSection>

            <LegalSection heading="3. Intellectual property">
                <LegalP>
                    The site, its content, branding, and software are owned by{' '}
                    {B.legalName} or its licensors and are protected by
                    intellectual-property laws. You may use the site only to
                    browse and place orders for personal use; all other rights are
                    reserved.
                </LegalP>
            </LegalSection>

            <LegalSection heading="4. Accounts & accuracy">
                <LegalP>
                    You are responsible for the accuracy of the information you
                    provide and for keeping your account secure. We may suspend or
                    terminate access for breach of these Terms or suspected misuse.
                </LegalP>
            </LegalSection>

            <LegalSection heading="5. Third-party services">
                <LegalP>
                    Payments are handled by <LegalTerm>PayHere</LegalTerm> and
                    deliveries may involve courier partners, each under their own
                    terms. We are not responsible for third-party services beyond
                    our reasonable control, though we will help resolve issues that
                    arise with your order.
                </LegalP>
            </LegalSection>

            <LegalSection heading="6. Availability & content">
                <LegalP>
                    We aim to keep the site accurate and available but do not
                    guarantee uninterrupted access, and we may change or withdraw
                    features. Pricing or listing errors may be corrected even after
                    an order is submitted, in which case we will notify you and
                    refund any affected payment.
                </LegalP>
            </LegalSection>

            <LegalSection heading="7. Limitation of liability">
                <LegalP>
                    To the fullest extent permitted by law, {B.legalName} is not
                    liable for indirect or consequential losses arising from your
                    use of the site. Nothing in these Terms excludes liability that
                    cannot be excluded under {B.jurisdiction} law, including your
                    statutory consumer rights.
                </LegalP>
            </LegalSection>

            <LegalSection heading="8. Governing law & disputes">
                <LegalP>
                    These Terms are governed by the laws of {B.jurisdiction}. Any
                    dispute will be subject to the exclusive jurisdiction of its
                    courts. We encourage you to contact us first at {B.email} so we
                    can try to resolve any concern directly.
                </LegalP>
            </LegalSection>

            <LegalSection heading="9. Changes">
                <LegalP>
                    We may update these Terms of Use; the effective date above
                    reflects the current version. Continued use of the site means
                    you accept the updated Terms.
                </LegalP>
            </LegalSection>
        </LegalPage>
    )
}
