import {
  IsArray,
  IsBoolean,
  IsIn,
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

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sellingPrice?: number;

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
