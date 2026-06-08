import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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

  @IsNumber()
  @Min(0)
  costPrice!: number;

  @IsNumber()
  @Min(0)
  sellingPrice!: number;

  /** Maximum Retail Price (optional; shown on the POS bill + receipt). */
  @IsNumber()
  @Min(0)
  @IsOptional()
  mrp?: number;

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
