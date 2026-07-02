import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSalesReturnLineDto {
  @IsUUID()
  saleItemId!: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  goodQuantity!: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  badQuantity!: number;

  @IsBoolean()
  restockGood!: boolean;

  /**
   * Optional expiry date (YYYY-MM-DD) for restocked good units. When set, the
   * restock recreates a ProductBatch so returned stock re-enters expiry
   * tracking; null/omitted still restocks but with unknown expiry.
   */
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class CreateSalesReturnDto {
  @IsUUID()
  saleId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSalesReturnLineDto)
  lines!: CreateSalesReturnLineDto[];
}
