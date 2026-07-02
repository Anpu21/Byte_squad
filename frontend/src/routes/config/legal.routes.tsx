import { Route } from 'react-router-dom'
import { FRONTEND_ROUTES } from '@/constants/routes'
import LegalLayout from '@/layouts/LegalLayout'
import {
    BusinessTermsPage,
    ContactPage,
    DeliveryPage,
    PrivacyPage,
    RefundPage,
    TermsPage,
} from '@/features/legal'

/**
 * Public legal / policy pages — NO guard. Mounted outside `ProtectedRoute` in
 * the aggregator so anyone (anonymous visitors, the PayHere partner-bank
 * reviewer) can read them. Wrapped in the chromeless `LegalLayout`.
 */
export const legalPublicRoutes = (
    <Route element={<LegalLayout />}>
        <Route
            path={FRONTEND_ROUTES.LEGAL_TERMS}
            element={<TermsPage />}
            handle={{ crumbs: ['Legal', 'Terms & Conditions'] }}
        />
        <Route
            path={FRONTEND_ROUTES.LEGAL_PRIVACY}
            element={<PrivacyPage />}
            handle={{ crumbs: ['Legal', 'Privacy Policy'] }}
        />
        <Route
            path={FRONTEND_ROUTES.LEGAL_REFUND}
            element={<RefundPage />}
            handle={{ crumbs: ['Legal', 'Refund & Cancellation'] }}
        />
        <Route
            path={FRONTEND_ROUTES.LEGAL_DELIVERY}
            element={<DeliveryPage />}
            handle={{ crumbs: ['Legal', 'Delivery & Pickup'] }}
        />
        <Route
            path={FRONTEND_ROUTES.LEGAL_CONTACT}
            element={<ContactPage />}
            handle={{ crumbs: ['Legal', 'Contact Us'] }}
        />
        <Route
            path={FRONTEND_ROUTES.LEGAL_BUSINESS_TERMS}
            element={<BusinessTermsPage />}
            handle={{ crumbs: ['Legal', 'Business & Legal Terms'] }}
        />
    </Route>
)
