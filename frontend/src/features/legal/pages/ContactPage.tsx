import type { ReactNode } from 'react'
import {
    LuClock as Clock,
    LuMail as Mail,
    LuMapPin as MapPin,
    LuPhone as Phone,
} from 'react-icons/lu'
import { BUSINESS_INFO } from '@/config/business-info'
import { LEGAL_EFFECTIVE_DATE } from '../config/legal-pages'
import { LegalPage } from '../components/LegalPage'
import { LegalP, LegalSection } from '../components/legal-prose'

const B = BUSINESS_INFO

function ContactRow({
    icon,
    label,
    children,
}: {
    icon: ReactNode
    label: string
    children: ReactNode
}) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
            <span className="mt-0.5 flex size-9 flex-none items-center justify-center rounded-lg bg-primary-soft text-primary-soft-text">
                {icon}
            </span>
            <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
                    {label}
                </div>
                <div className="mt-1 text-[14.5px] font-medium text-text-1">
                    {children}
                </div>
            </div>
        </div>
    )
}

export function ContactPage() {
    return (
        <LegalPage
            title="Contact Us"
            effectiveDate={LEGAL_EFFECTIVE_DATE}
            intro={`Questions about an order, a payment, or our policies? Reach ${B.tradeName} through any of the channels below — we're happy to help.`}
        >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ContactRow icon={<MapPin size={18} />} label="Address">
                    {B.address}
                </ContactRow>
                <ContactRow icon={<Mail size={18} />} label="Email">
                    <a
                        href={`mailto:${B.email}`}
                        className="text-primary hover:underline"
                    >
                        {B.email}
                    </a>
                </ContactRow>
                <ContactRow icon={<Phone size={18} />} label="Phone">
                    <a
                        href={`tel:${B.phone.replace(/\s+/g, '')}`}
                        className="text-primary hover:underline"
                    >
                        {B.phone}
                    </a>
                </ContactRow>
                <ContactRow icon={<Clock size={18} />} label="Support hours">
                    {B.hours}
                </ContactRow>
            </div>

            <LegalSection heading="Business details">
                <LegalP>
                    This store is operated by {B.legalName} (Business
                    Registration No. {B.regNo}), {B.address}. For order-specific
                    queries, please include your order number so we can help you
                    faster.
                </LegalP>
            </LegalSection>

            <LegalSection heading="Payments">
                <LegalP>
                    Online payments are processed securely by PayHere. If you have
                    a question about a charge, contact us with your order number
                    and the payment reference from your confirmation.
                </LegalP>
            </LegalSection>
        </LegalPage>
    )
}
