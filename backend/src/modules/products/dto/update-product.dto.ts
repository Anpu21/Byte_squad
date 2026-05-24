import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

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
  @IsOptional()
  wholesalePrice?: number;

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
}
