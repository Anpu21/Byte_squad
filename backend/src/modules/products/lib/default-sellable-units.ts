// Sibling FE mirror: frontend/src/features/product-form/lib/sellable-units.ts
import type { DeepPartial } from 'typeorm';
import type { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import {
  isSupportedBaseUnit,
  type TSupportedBaseUnit,
} from '@products/lib/supported-base-units';

interface UnitSeed {
  name: string;
  barcode: string | null;
  isBase: boolean;
  conversionToBase: number;
  sellingPrice: number;
  displayOrder: number;
}

/**
 * Default companion units for each well-known base unit. Kept as a lookup
 * table so adding a new base (e.g. metric tonne) is a single map entry.
 *
 * LedgerPro keeps stock in exactly one base unit: kg, l, or unit. Pack rows
 * such as 12-PACK are manager-created sellable units with their own barcode,
 * conversion, and price; they are not base-unit defaults.
 */
function baseSeed(name: TSupportedBaseUnit, sellingPrice: number): UnitSeed {
  return {
    name,
    barcode: null,
    isBase: true,
    conversionToBase: 1,
    sellingPrice,
    displayOrder: 0,
  };
}

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
  sellingPrice = 0,
): DeepPartial<ProductSellableUnit>[] {
  const lowered = baseUnit.toLowerCase();
  const seeds: UnitSeed[] = isSupportedBaseUnit(lowered)
    ? [baseSeed(lowered, sellingPrice)]
    : [
        {
          name: baseUnit,
          barcode: null,
          isBase: true,
          conversionToBase: 1,
          sellingPrice,
          displayOrder: 0,
        },
      ];
  return seeds.map((s) => ({ ...s, productId }));
}
