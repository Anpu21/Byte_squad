/**
 * Decode a retail-scale "random weight" barcode into its PLU item code and the
 * weighed amount.
 *
 * The weight-embedded standard is **UPC-A number system `2`** — 12 digits laid
 * out as `2 PPPPP WWWWW C`:
 *   - index 0:       number-system flag `2` (in-store variable measure)
 *   - indices 1..5:  5-digit PLU / item code
 *   - indices 6..10: 5-digit weight in grams (00000–99999 → 0–99.999 kg)
 *   - index 11:      UPC-A mod-10 check digit
 *
 * Many scanners report this UPC-A as a zero-extended 13-digit EAN-13
 * (`0` + the 12 digits); that leading zero is stripped before decoding.
 *
 * Field offsets and the weight divisor are constants so a different scale
 * layout can be accommodated without touching call sites. Price-embedded
 * barcodes are intentionally NOT handled here — LedgerPro prices weighed lines
 * server-side as weight × per-kg.
 */

const FLAG_DIGIT = '2';
const PLU_START = 1;
const PLU_END = 6; // exclusive → indices 1..5 (5 digits)
const WEIGHT_START = 6;
const WEIGHT_END = 11; // exclusive → indices 6..10 (5 digits)
const GRAMS_PER_KG = 1000;

export interface IParsedWeightBarcode {
    /** The product's PLU / item code (to resolve the product). */
    pluCode: string;
    /** Decoded weight in kilograms (the cart line quantity). */
    weightKg: number;
}

/** UPC-A mod-10 check digit over the first 11 digits (odd positions ×3). */
function upcACheckDigit(first11: string): number {
    let sum = 0;
    for (let i = 0; i < 11; i++) {
        const d = first11.charCodeAt(i) - 48;
        sum += i % 2 === 0 ? d * 3 : d;
    }
    return (10 - (sum % 10)) % 10;
}

/**
 * Returns the decoded PLU + weight for a weight-embedded scale barcode, or
 * `null` when the code is not a valid number-system-`2` random-weight barcode
 * (wrong length, wrong flag, bad check digit, or zero weight).
 */
export function parseWeightBarcode(raw: string): IParsedWeightBarcode | null {
    let code = raw.trim();
    // Scanners may emit the UPC-A as a zero-extended EAN-13 — drop the pad.
    if (/^0\d{12}$/.test(code)) code = code.slice(1);
    if (!/^\d{12}$/.test(code)) return null;
    if (code[0] !== FLAG_DIGIT) return null;
    if (upcACheckDigit(code.slice(0, 11)) !== code.charCodeAt(11) - 48) {
        return null;
    }

    const pluCode = code.slice(PLU_START, PLU_END);
    const grams = Number(code.slice(WEIGHT_START, WEIGHT_END));
    if (!(grams > 0)) return null;

    return { pluCode, weightKg: grams / GRAMS_PER_KG };
}
