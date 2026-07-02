import type { ReactNode } from 'react'

/**
 * Token-driven prose primitives shared by every legal page, so all six read
 * consistently and recolour correctly in dark mode. Deliberately plain — legal
 * copy wants legibility, not ornament.
 */

/** A numbered/titled policy section. */
export function LegalSection({
    heading,
    children,
}: {
    heading: string
    children: ReactNode
}) {
    return (
        <section className="mt-8 first:mt-0">
            <h2 className="font-display text-[19px] font-semibold tracking-[-0.01em] text-text-1">
                {heading}
            </h2>
            <div className="mt-2.5 space-y-3">{children}</div>
        </section>
    )
}

/** A body paragraph. */
export function LegalP({ children }: { children: ReactNode }) {
    return (
        <p className="text-[14.5px] leading-relaxed text-text-2">{children}</p>
    )
}

/** A bulleted list of points. */
export function LegalList({ items }: { items: ReactNode[] }) {
    return (
        <ul className="ml-4 list-disc space-y-1.5 text-[14.5px] leading-relaxed text-text-2 marker:text-text-3">
            {items.map((item, i) => (
                <li key={i} className="pl-1">
                    {item}
                </li>
            ))}
        </ul>
    )
}

/** Inline emphasis for defined terms / labels. */
export function LegalTerm({ children }: { children: ReactNode }) {
    return <strong className="font-semibold text-text-1">{children}</strong>
}
