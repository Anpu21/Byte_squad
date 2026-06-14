import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreatePurchaseReturnItemDto {
  /** Must be a product that exists on the originating GRN. */
  @IsUUID()
  productId!: string;

  @IsNumber()
  @Min(0.001)
  @Max(1_000_000)
  quantity!: number;
}

export class CreatePurchaseReturnDto {
  @IsUUID()
  grnId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReturnItemDto)
  items!: CreatePurchaseReturnItemDto[];
}
