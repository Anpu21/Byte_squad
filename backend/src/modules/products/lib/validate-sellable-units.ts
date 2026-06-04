import { BadRequestException } from '@nestjs/common';
import type { SellableUnitDto } from '@products/dto/sellable-unit.dto';

/**
 * Pure validator for an array of sellable-unit rows.
 *
 * Rules:
 * - Non-empty.
 * - Exactly one row has `isBase = true`.
 * - The base row's `conversionToBase` is exactly 1.
 * - Unit names are unique (case-insensitive).
 * - Unit barcodes are unique when provided.
 * - Every row has a selling price.
 *
 * Returns the input array unchanged when valid. Throws `BadRequestException`
 * with a human-readable message otherwise. Pure — no I/O, no mutation.
 */
export function validateSellableUnits<T extends SellableUnitDto>(
  rows: readonly T[],
): readonly T[] {
  if (rows.length === 0) {
    throw new BadRequestException('At least one sellable unit is required.');
  }
  const baseRows = rows.filter((r) => r.isBase);
  if (baseRows.length !== 1) {
    throw new BadRequestException(
      'Exactly one sellable unit must be marked as the base unit.',
    );
  }
  if (baseRows[0].conversionToBase !== 1) {
    throw new BadRequestException(
      'The base unit must have conversionToBase equal to 1.',
    );
  }
  const seen = new Set<string>();
  const seenBarcodes = new Set<string>();
  for (const r of rows) {
    const key = r.name.toLowerCase();
    if (seen.has(key)) {
      throw new BadRequestException(`Duplicate unit name: ${r.name}`);
    }
    seen.add(key);
    if (
      !Number.isFinite(Number(r.sellingPrice)) ||
      Number(r.sellingPrice) < 0
    ) {
      throw new BadRequestException(
        `Selling price for unit ${r.name} must be 0 or more.`,
      );
    }
    const barcode = r.barcode?.trim();
    if (!barcode) continue;
    const barcodeKey = barcode.toLowerCase();
    if (seenBarcodes.has(barcodeKey)) {
      throw new BadRequestException(`Duplicate unit barcode: ${barcode}`);
    }
    seenBarcodes.add(barcodeKey);
  }
  return rows;
}
