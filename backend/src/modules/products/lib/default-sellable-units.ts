import type { DeepPartial } from 'typeorm';
import type { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import {
  isSupportedBaseUnit,
  type TSupportedBaseUnit,
} from '@products/lib/supported-base-units';

interface UnitSeed {
  name: string;
  isBase: boolean;
  conversionToBase: number;
  displayOrder: number;
}

/**
 * Default companion units for each well-known base unit. Kept as a lookup
 * table so adding a new base (e.g. metric tonne) is a single map entry.
 *
 * - Mass:   kg <-> g  (1 kg = 1000 g, 1 g = 0.001 kg)
 * - Volume: l  <-> ml (1 l  = 1000 ml, 1 ml = 0.001 l)
 * - Discrete (each / bottle / pack / box): single self-mirroring row so the
 *   cashier dropdown always has at least one option but nothing to convert.
 */
const DEFAULTS_BY_BASE_UNIT: Record<TSupportedBaseUnit, UnitSeed[]> = {
  kg: [
    { name: 'kg', isBase: true, conversionToBase: 1, displayOrder: 0 },
    { name: 'g', isBase: false, conversionToBase: 0.001, displayOrder: 1 },
  ],
  g: [
    { name: 'g', isBase: true, conversionToBase: 1, displayOrder: 0 },
    { name: 'kg', isBase: false, conversionToBase: 1000, displayOrder: 1 },
  ],
  l: [
    { name: 'l', isBase: true, conversionToBase: 1, displayOrder: 0 },
    { name: 'ml', isBase: false, conversionToBase: 0.001, displayOrder: 1 },
  ],
  ml: [
    { name: 'ml', isBase: true, conversionToBase: 1, displayOrder: 0 },
    { name: 'l', isBase: false, conversionToBase: 1000, displayOrder: 1 },
  ],
  // Discrete items: only the base unit, no companions.
  each: [{ name: 'each', isBase: true, conversionToBase: 1, displayOrder: 0 }],
  bottle: [
    { name: 'bottle', isBase: true, conversionToBase: 1, displayOrder: 0 },
  ],
  pack: [{ name: 'pack', isBase: true, conversionToBase: 1, displayOrder: 0 }],
  box: [{ name: 'box', isBase: true, conversionToBase: 1, displayOrder: 0 }],
};

/**
 * Companion units for a product, derived from its base unit. Each entry is
 * shape-compatible with `ProductSellableUnit` (minus `id`, `createdAt`,
 * `updatedAt`). Unknown base units fall back to a single self-mirroring row
 * so the cashier dropdown is never empty.
 *
 * Lookup is case-insensitive — admins seeding products with `KG`/`Kg` still
 * land on the metric mass defaults.
 *
 * @param productId Owning product UUID — copied verbatim onto each seed.
 * @param baseUnit  The product's canonical base unit (e.g. `kg`, `each`).
 */
export function defaultSellableUnitsFor(
  productId: string,
  baseUnit: string,
): DeepPartial<ProductSellableUnit>[] {
  const lowered = baseUnit.toLowerCase();
  const seeds: UnitSeed[] = isSupportedBaseUnit(lowered)
    ? DEFAULTS_BY_BASE_UNIT[lowered]
    : [{ name: baseUnit, isBase: true, conversionToBase: 1, displayOrder: 0 }];
  return seeds.map((s) => ({ ...s, productId }));
}
