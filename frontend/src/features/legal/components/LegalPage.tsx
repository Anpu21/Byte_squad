import type { ReactNode } from 'react'
import { BUSINESS_INFO } from '@/config/business-info'

interface LegalPageProps {
    title: string
    /** Effective date — a fixed string per page, bumped when the policy changes. */
    effectiveDate: string
    /** One-line summary shown under the title. */
    intro?: ReactNode
    children: ReactNode
}

/**
 * Shared shell for every legal page: display-font title, business name +
 * effective date, an optional intro line, and the policy body. The public
 * `LegalLayout` supplies the page chrome (logo header + cross-link footer).
 */
export function LegalPage({
    title,
    effectiveDate,
    intro,
    children,
}: LegalPageProps) {
    return (
        <article className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <header className="border-b border-border pb-6">
                <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-0.015em] text-text-1 sm:text-[34px]">
                    {title}
                </h1>
                <p className="mt-2 text-[13px] text-text-3">
                    {BUSINESS_INFO.tradeName} · Effective {effectiveDate}
                </p>
                {intro && (
                    <p className="mt-4 text-[15px] leading-relaxed text-text-2">
                        {intro}
                    </p>
                )}
            </header>
            <div className="py-7">{children}</div>
        </article>
    )
}
