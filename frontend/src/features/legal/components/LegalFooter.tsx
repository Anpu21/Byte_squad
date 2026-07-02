import { Link } from 'react-router-dom'
import { BUSINESS_INFO } from '@/config/business-info'
import { cn } from '@/lib/utils'
import { LEGAL_PAGES } from '../config/legal-pages'

interface LegalFooterProps {
    /**
     * `full` — labelled footer block with the business line (storefront / legal
     * layout). `compact` — a single muted row of links (auth pages).
     */
    variant?: 'full' | 'compact'
    className?: string
}

/** Cross-links to every public legal page, driven by `LEGAL_PAGES`. */
export function LegalFooter({
    variant = 'full',
    className,
}: LegalFooterProps) {
    const links = LEGAL_PAGES.map((page) => (
        <Link
            key={page.key}
            to={page.route}
            className="text-text-3 hover:text-text-1 transition-colors focus:outline-none focus-visible:ring-[2px] focus-visible:ring-focus/30 rounded-sm"
        >
            {page.label}
        </Link>
    ))

    if (variant === 'compact') {
        return (
            <nav
                aria-label="Legal"
                className={cn(
                    'flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px]',
                    className,
                )}
            >
                {links}
            </nav>
        )
    }

    return (
        <div className={cn('text-xs text-text-3', className)}>
            <nav
                aria-label="Legal"
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-medium"
            >
                {links}
            </nav>
            <p className="mt-3 text-text-3">
                © {BUSINESS_INFO.tradeName}. Secure payments by PayHere ·
                Pickup &amp; delivery across Sri Lanka.
            </p>
        </div>
    )
}
