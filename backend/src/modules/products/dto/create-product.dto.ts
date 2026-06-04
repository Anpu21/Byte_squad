import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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

  @IsString()
  @IsNotEmpty()
  category!: string;

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
