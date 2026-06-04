import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

/**
 * Inbound row shape for a single sellable-unit entry on a product.
 *
 * Used inside `CreateProductDto.sellableUnits[]` and
 * `UpdateProductDto.sellableUnits[]` to let managers override the
 * auto-seeded defaults from `defaultSellableUnitsFor`. The shape mirrors
 * `ProductSellableUnit` (minus id / timestamps / productId) so the service
 * can persist these directly with the owning product id stamped on.
 */
export class SellableUnitDto {
  /** Display + lookup name, e.g. `kg`, `unit`, `12-PACK`. */
  @IsString()
  @Length(1, 32)
  name!: string;

  /** Optional barcode that scans directly to this sellable unit. */
  @IsOptional()
  @IsString()
  @Length(1, 128)
  barcode?: string | null;

  /** True for exactly one row per product — the canonical conversion unit. */
  @IsBoolean()
  isBase!: boolean;

  /**
   * Multiplier from this unit to the base unit. Must be > 0; `0.000001`
   * is a sensible floor (one micro-base) without rejecting precise decimal
   * weighted or volume quantities.
   */
  @IsNumber()
  @Min(0.000001)
  conversionToBase!: number;

  /** Price for one cashier-entered quantity of this sellable unit. */
  @IsNumber()
  @Min(0)
  sellingPrice!: number;

  /** Sort order for the cashier dropdown; 0 = first. */
  @IsInt()
  @Min(0)
  displayOrder!: number;
}
