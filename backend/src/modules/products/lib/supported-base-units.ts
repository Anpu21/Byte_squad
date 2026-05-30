/**
 * Canonical allow-list of base units accepted across the products domain.
 *
 * Single source of truth shared by:
 * - {@link defaultSellableUnitsFor} — keyed lookup for auto-seeded
 *   companion units when a product is created without an explicit list.
 * - {@link CreateProductDto} / {@link UpdateProductDto} — `@IsIn` validation
 *   on the inbound `baseUnit` field so managers cannot create a product
 *   with an unsupported base.
 *
 * Adding a new unit (e.g. `tonne`) is a single tuple entry plus a default
 * row in `default-sellable-units.ts`.
 */
export const SUPPORTED_BASE_UNITS = [
  'kg',
  'g',
  'l',
  'ml',
  'each',
  'bottle',
  'pack',
  'box',
] as const;

export type TSupportedBaseUnit = (typeof SUPPORTED_BASE_UNITS)[number];

/**
 * Narrowing guard for arbitrary strings. Use this when accepting a value
 * from validated DTO input that has already been coerced to `string` and
 * you want the more specific literal-union type for downstream lookups.
 */
export function isSupportedBaseUnit(
  value: string,
): value is TSupportedBaseUnit {
  return (SUPPORTED_BASE_UNITS as readonly string[]).includes(value);
}
