import {
  IsBoolean,
  IsInt,
  IsNumber,
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
  /** Display + lookup name, e.g. `kg`, `g`, `pack`. */
  @IsString()
  @Length(1, 32)
  name!: string;

  /** True for exactly one row per product — the canonical conversion unit. */
  @IsBoolean()
  isBase!: boolean;

  /**
   * Multiplier from this unit to the base unit. Must be > 0; `0.000001`
   * is a sensible floor (one micro-base) without rejecting precise values
   * like `0.001` (g → kg).
   */
  @IsNumber()
  @Min(0.000001)
  conversionToBase!: number;

  /** Sort order for the cashier dropdown; 0 = first. */
  @IsInt()
  @Min(0)
  displayOrder!: number;
}
