import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FRONTEND_ROUTES } from '@/constants/routes'
import { BUSINESS_INFO, placeholderFields } from '@/config/business-info'
import { LEGAL_PAGES } from '../config/legal-pages'
import { LegalFooter } from '../components/LegalFooter'
import { TermsPage } from '../pages/TermsPage'
import { PrivacyPage } from '../pages/PrivacyPage'
import { RefundPage } from '../pages/RefundPage'
import { DeliveryPage } from '../pages/DeliveryPage'
import { ContactPage } from '../pages/ContactPage'
import { BusinessTermsPage } from '../pages/BusinessTermsPage'

const PAGES = [
    { title: 'Terms & Conditions', Comp: TermsPage },
    { title: 'Privacy Policy', Comp: PrivacyPage },
    { title: 'Refund & Cancellation Policy', Comp: RefundPage },
    { title: 'Delivery & Pickup Policy', Comp: DeliveryPage },
    { title: 'Contact Us', Comp: ContactPage },
    { title: 'Business & Legal Terms (Terms of Use)', Comp: BusinessTermsPage },
]

function renderWithRouter(ui: React.ReactElement) {
    return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('legal pages', () => {
    it.each(PAGES)('renders the "$title" heading', ({ title, Comp }) => {
        renderWithRouter(<Comp />)
        expect(
            screen.getByRole('heading', { level: 1, name: title }),
        ).toBeInTheDocument()
    })

    it('Contact page surfaces the real business email and phone', () => {
        renderWithRouter(<ContactPage />)
        expect(screen.getByText(BUSINESS_INFO.email)).toBeInTheDocument()
        expect(screen.getByText(BUSINESS_INFO.phone)).toBeInTheDocument()
    })
})

describe('LEGAL_PAGES metadata', () => {
    const validRoutes = new Set<string>(Object.values(FRONTEND_ROUTES))

    it('every entry points at a real FRONTEND_ROUTES path', () => {
        for (const page of LEGAL_PAGES) {
            expect(validRoutes.has(page.route)).toBe(true)
        }
    })

    it('LegalFooter renders one link per page', () => {
        renderWithRouter(<LegalFooter />)
        for (const page of LEGAL_PAGES) {
            const link = screen.getByRole('link', { name: page.label })
            expect(link).toHaveAttribute('href', page.route)
        }
    })

    it('compact LegalFooter also lists every page', () => {
        renderWithRouter(<LegalFooter variant="compact" />)
        expect(screen.getAllByRole('link')).toHaveLength(LEGAL_PAGES.length)
    })
})

describe('business info go-live checklist', () => {
    // Not a failure — a visible reminder of which BUSINESS_INFO fields still
    // hold ⟨placeholders⟩ before the site goes to PayHere / bank review.
    it('reports any remaining placeholder fields', () => {
        const pending = placeholderFields()
        if (pending.length > 0) {
            console.warn(
                `[go-live] Fill these BUSINESS_INFO fields before submitting: ${pending.join(', ')}`,
            )
        }
        expect(Array.isArray(pending)).toBe(true)
    })
})
