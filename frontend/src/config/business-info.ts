/**
 * Single source of truth for the business's legal identity, shown across the
 * public legal / policy pages (Terms, Privacy, Refund, Delivery, Contact,
 * Business Terms) and their shared footer.
 *
 * Values wrapped in ⟨angle brackets⟩ are PLACEHOLDERS — fill them with the real
 * registered details before submitting the site for PayHere / bank review.
 * `hasPlaceholders()` / `placeholderFields()` below drive the pre-go-live
 * checklist (and a test that reminds you what's still unfilled).
 */
export const BUSINESS_INFO = {
    /** Registered legal entity name (refine if incorporated, e.g. "… (Pvt) Ltd"). */
    legalName: 'Danista Store',
    /** Public-facing brand / trade name. */
    tradeName: 'Danista Store',
    /** Business Registration / company number. */
    regNo: 'DS/MSW/AD/ABR/82',
    /** Full registered address. */
    address: 'Thadcanamaruthamadhu, Palapiddy, Madhu, Mannar, Sri Lanka',
    /** Support / contact email. */
    email: 'ledgerpro111@gmail.com',
    /** Contact phone (international format). */
    phone: '+94 70 372 8309',
    /** Customer support hours. */
    hours: 'Monday–Saturday, 8:00am–8:00pm',
    /** Public website URL. */
    websiteUrl: 'https://www.ledgerpro.shop',
    /** Governing-law jurisdiction. */
    jurisdiction: 'Sri Lanka',
    /** Payment currency (matches the PayHere backend — LKR). */
    currency: 'LKR',
} as const

export type BusinessInfo = typeof BUSINESS_INFO

const PLACEHOLDER = /⟨.*⟩/

/** Fields still holding a ⟨placeholder⟩ — the go-live checklist. */
export function placeholderFields(): (keyof BusinessInfo)[] {
    return (Object.keys(BUSINESS_INFO) as (keyof BusinessInfo)[]).filter((key) =>
        PLACEHOLDER.test(BUSINESS_INFO[key]),
    )
}

/** True while any business detail is still a placeholder. */
export function hasPlaceholders(): boolean {
    return placeholderFields().length > 0
}
