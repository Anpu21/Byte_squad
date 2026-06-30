import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SellableUnitDto } from '@products/dto/sellable-unit.dto';
import {
  SUPPORTED_BASE_UNITS,
  type TSupportedBaseUnit,
} from '@products/lib/supported-base-units';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  barcode!: string;

  // Numeric PLU/item code for weighed products (embedded in scale barcodes).
  // Empty string normalizes to undefined so the partial-unique index isn't hit.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString()
  @Matches(/^\d{1,16}$/, { message: 'pluCode must be 1-16 digits' })
  pluCode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Product category — supply the managed-category `categoryId` (preferred) or
  // its `category` name (the datalist product form sends the name). The service
  // resolves either to the FK and keeps `product.category` as a synced mirror.
  @IsString()
  @IsOptional()
  category?: string;

  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  // Product brand (optional) — supply the managed-brand `brandId` (preferred) or
  // its `brand` name (the datalist product form sends the name). The service
  // resolves either to the FK, auto-creating the brand when the name is new, and
  // keeps `product.brand` as a synced mirror.
  @IsString()
  @IsOptional()
  brand?: string;

  @IsUUID('4')
  @IsOptional()
  brandId?: string;

  @IsNumber()
  @Min(0)
  costPrice!: number;

  @IsNumber()
  @Min(0)
  sellingPrice!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number;

  @IsBoolean()
  @IsOptional()
  discountAllowed?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsOptional()
  @IsIn(SUPPORTED_BASE_UNITS as readonly string[])
  baseUnit?: TSupportedBaseUnit;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellableUnitDto)
  sellableUnits?: SellableUnitDto[];
}
