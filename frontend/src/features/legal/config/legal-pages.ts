import { FRONTEND_ROUTES } from '@/constants/routes'

/** Shared "effective / last updated" date — bump when any policy changes. */
export const LEGAL_EFFECTIVE_DATE = '2 July 2026'

/** One public legal page — drives the footer nav and cross-links (single source). */
export interface LegalPageMeta {
    key: string
    route: string
    /** Short label for footers / nav. */
    label: string
    /** Full page title (also the browser/breadcrumb heading). */
    title: string
}

/**
 * The public legal pages, in the order they appear in footers and cross-links.
 * Every `route` is a real `FRONTEND_ROUTES` value (asserted by a test), so the
 * footer can never point at a dead path.
 */
export const LEGAL_PAGES: LegalPageMeta[] = [
    {
        key: 'terms',
        route: FRONTEND_ROUTES.LEGAL_TERMS,
        label: 'Terms & Conditions',
        title: 'Terms & Conditions',
    },
    {
        key: 'privacy',
        route: FRONTEND_ROUTES.LEGAL_PRIVACY,
        label: 'Privacy Policy',
        title: 'Privacy Policy',
    },
    {
        key: 'refund',
        route: FRONTEND_ROUTES.LEGAL_REFUND,
        label: 'Refund & Returns',
        title: 'Refund, Return & Cancellation Policy',
    },
    {
        key: 'delivery',
        route: FRONTEND_ROUTES.LEGAL_DELIVERY,
        label: 'Delivery & Pickup',
        title: 'Delivery & Pickup Policy',
    },
    {
        key: 'contact',
        route: FRONTEND_ROUTES.LEGAL_CONTACT,
        label: 'Contact Us',
        title: 'Contact Us',
    },
    {
        key: 'business-terms',
        route: FRONTEND_ROUTES.LEGAL_BUSINESS_TERMS,
        label: 'Business & Legal Terms',
        title: 'Business & Legal Terms (Terms of Use)',
    },
]
