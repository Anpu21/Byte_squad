/**
 * Unit-aware quantity semantics for the storefront.
 *
 * A product's `baseUnit` decides whether fractional quantities are allowed:
 * weighable / pourable goods (`kg`, `l`, …) sell in fractions, countable goods
 * (`unit`) sell only in whole numbers. This mirrors the backend rule in
 * `customer-orders.service.ts` — `buildOrderItems` rejects a fractional
 * `baseUnitQty` when `product.baseUnit === 'unit'` — so the UI never lets a
 * shopper build a cart the API would reject.
 *
 * Granularity (product decision): fractional units step by ¼ kg/l with a 0.05
 * (50 g / 50 ml) minimum order. The minimum sits above the max decimal
 * precision and select-on-focus lets a single keystroke replace it, so the
 * field never gets stuck the way a sub-gram floor did. Countable units step
 * by 1.
 */

/** +/- tap step for a fractional unit (¼ kg / ¼ l). */
const FRACTION_STEP = 0.25;
/** Smallest orderable amount for a fractional unit (50 g / 50 ml). */
const FRACTION_MIN = 0.05;
/** Decimal places the backend persists (`numeric(12,3)`). */
const FRACTION_DECIMALS = 3;

export interface QtyRules {
    /** +/- button step. */
    step: number;
    /** Smallest orderable quantity. */
    min: number;
    /** Max decimal places (0 for countable units). */
    decimals: number;
}

/**
 * True when `baseUnit` sells in fractions (anything other than the countable
 * `unit`). Case / whitespace-insensitive; an empty or unknown unit is treated
 * as countable — the safe default that never offers fractions the API would
 * reject.
 */
export function isFractionalUnit(baseUnit: string): boolean {
    const normalized = baseUnit.trim().toLowerCase();
    return normalized !== '' && normalized !== 'unit';
}

/** Step / min / decimals for a unit, used to drive the quantity input. */
export function qtyRules(baseUnit: string): QtyRules {
    return isFractionalUnit(baseUnit)
        ? { step: FRACTION_STEP, min: FRACTION_MIN, decimals: FRACTION_DECIMALS }
        : { step: 1, min: 1, decimals: 0 };
}

function roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

/**
 * Coerce a raw quantity into a valid value for `baseUnit`: rounded to the
 * unit's decimal precision and floored to its minimum (countable units round
 * to whole numbers). Returns `min` for non-finite or sub-minimum input.
 */
export function clampQty(value: number, baseUnit: string): number {
    const { min, decimals } = qtyRules(baseUnit);
    if (!Number.isFinite(value)) return min;
    const rounded = roundTo(value, decimals);
    return rounded < min ? min : rounded;
}

/**
 * Weight implied by a cash amount at a unit price, rounded to the unit's
 * precision (nearest — the product decision): `1000 ÷ 170 → 5.882 kg`. Powers
 * "buy by amount", where a shopper names the cash and we derive the weight.
 *
 * Deliberately does *not* floor to the order minimum: the derived weight has to
 * reconcile with the entered amount (the backend accepts the line only when
 * `|amount − weight × price|` is within the rounding gap), and flooring a tiny
 * amount up to `min` would break that. The minimum is enforced separately by
 * the caller's add gate. Returns `0` for non-finite input or a non-positive
 * price (caller treats that as "nothing to add").
 */
export function quantityForAmount(
    amount: number,
    unitPrice: number,
    baseUnit: string,
): number {
    if (
        !Number.isFinite(amount) ||
        !Number.isFinite(unitPrice) ||
        unitPrice <= 0
    ) {
        return 0;
    }
    return roundTo(amount / unitPrice, qtyRules(baseUnit).decimals);
}

/**
 * Cash a quantity costs at a unit price, rounded to 2 dp (money):
 * `5.882 × 170 → 999.94`. The inverse of {@link quantityForAmount}; used to
 * preview the spend in weight mode and to mirror the backend's line total.
 */
export function amountForQuantity(qty: number, unitPrice: number): number {
    if (!Number.isFinite(qty) || !Number.isFinite(unitPrice)) return 0;
    return roundTo(qty * unitPrice, 2);
}

/**
 * Human label for a quantity + unit, trailing zeros trimmed:
 * `1.5 → "1.5 kg"`, `2 → "2 kg"`, `0.25 → "0.25 kg"`.
 */
export function formatQty(qty: number, unitLabel: string): string {
    const safe = Number.isFinite(qty) ? qty : 0;
    // parseFloat(toFixed) collapses trailing zeros: 2.000 → 2, 1.50 → 1.5.
    const trimmed = parseFloat(safe.toFixed(FRACTION_DECIMALS));
    return `${trimmed} ${unitLabel}`;
}
